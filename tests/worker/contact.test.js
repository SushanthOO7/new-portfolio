import { describe, expect, it, vi } from 'vitest';
import { createContactHandler } from '../../src/lib/contact.server.js';

const env = { AWS_ACCESS_KEY_ID: 'access', AWS_SECRET_ACCESS_KEY: 'secret', EMAIL: 'to@example.com', FROM_EMAIL: 'from@example.com' };
const body = { name: '', email: 'person@example.com', message: 'A private message' };
const request = (value=body, options={}) => new Request('https://portfolio.test/api/contact', { method:'POST', headers:{'content-type':'application/json',...(options.headers??{})}, body:JSON.stringify(value), signal:options.signal });

describe('contact Worker handler', () => {
  it('sends valid input and returns a no-store success response', async () => {
    const sendEmail=vi.fn().mockResolvedValue(undefined);
    const response=await createContactHandler({sendEmail,env,logger:{error:vi.fn()}})(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({success:true});
    expect(sendEmail).toHaveBeenCalledWith({email:body.email,message:body.message});
  });

  it('returns success for the honeypot without sending', async () => {
    const sendEmail=vi.fn();
    const response=await createContactHandler({sendEmail,env,logger:{error:vi.fn()}})(request({...body,name:'bot'}));
    expect(await response.json()).toEqual({success:true});
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects validation failures', async () => {
    const response=await createContactHandler({sendEmail:vi.fn(),env,logger:{error:vi.fn()}})(request({...body,email:'bad'}));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({success:false,errors:{email:'Please enter a valid email address.'}});
  });

  it('rejects oversized request bodies before parsing', async () => {
    const oversized=new Request('https://portfolio.test/api/contact',{method:'POST',headers:{'content-type':'application/json','content-length':'9000'},body:JSON.stringify(body)});
    const response=await createContactHandler({sendEmail:vi.fn(),env,logger:{error:vi.fn()}})(oversized);
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({success:false,errors:{form:'Request body is too large.'}});
  });

  it('fails safely when server secrets are missing', async () => {
    const response=await createContactHandler({sendEmail:vi.fn(),env:{},logger:{error:vi.fn()}})(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({success:false,errors:{form:'Message service is unavailable.'}});
  });

  it('maps SES rejection to a safe response and never logs private values', async () => {
    const logger={error:vi.fn()};
    const response=await createContactHandler({sendEmail:vi.fn().mockRejectedValue(new Error(`failed ${body.email} ${body.message} ${env.AWS_SECRET_ACCESS_KEY}`)),env,logger})(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({success:false,errors:{form:'Message could not be sent. Please try again.'}});
    const logs=JSON.stringify(logger.error.mock.calls);
    expect(logs).not.toContain(body.email);
    expect(logs).not.toContain(body.message);
    expect(logs).not.toContain(env.AWS_ACCESS_KEY_ID);
    expect(logs).not.toContain(env.AWS_SECRET_ACCESS_KEY);
  });

  it('honors an already aborted client request', async () => {
    const controller=new AbortController();controller.abort();
    const response=await createContactHandler({sendEmail:vi.fn(),env,logger:{error:vi.fn()}})(request(body,{signal:controller.signal}));
    expect(response.status).toBe(499);
    expect(await response.json()).toEqual({success:false,errors:{form:'Request was cancelled.'}});
  });
});
