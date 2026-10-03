import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root=resolve(import.meta.dirname,'../..');
const wrangler=resolve(root,'node_modules/.bin/wrangler');
const body={name:'',email:'person@example.com',message:'Worker integration message'};
let mock;
let mockPort;
let mockStatus=200;
let signedRequests=0;

async function freePort() {
  const server=createServer();
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const {port}=server.address();
  server.close();
  await once(server,'close');
  return port;
}

async function startWorker(vars=[]) {
  const port=await freePort();
  const args=['dev','--ip','127.0.0.1','--port',String(port),...vars.flatMap(([key,value])=>['--var',`${key}:${value}`])];
  const child=spawn(wrangler,args,{cwd:root,env:{...process.env,NO_COLOR:'1'},stdio:['ignore','pipe','pipe']});
  let output='';
  const ready=new Promise((resolveReady,reject)=>{
    const timer=setTimeout(()=>reject(new Error(`Wrangler did not start:\n${output}`)),20_000);
    const onData=chunk=>{
      output+=chunk;
      if (/Ready on http:\/\/127\.0\.0\.1/.test(output)) {
        clearTimeout(timer);
        resolveReady();
      }
    };
    child.stdout.on('data',onData);
    child.stderr.on('data',onData);
    child.once('exit',code=>reject(new Error(`Wrangler exited (${code}):\n${output}`)));
  });
  await ready;
  return {
    origin:`http://127.0.0.1:${port}`,
    output:()=>output,
    async stop() {
      if (child.exitCode !== null) return;
      child.kill('SIGTERM');
      await Promise.race([once(child,'exit'),new Promise(resolve=>setTimeout(resolve,3000))]);
      if (child.exitCode === null) child.kill('SIGKILL');
    },
  };
}

async function submit(origin,value=body) {
  return fetch(`${origin}/api/contact`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value),
  });
}

beforeAll(async()=>{
  mock=createServer((request,response)=>{
    if (request.headers.authorization?.startsWith('AWS4-HMAC-SHA256')) signedRequests+=1;
    request.resume();
    response.statusCode=mockStatus;
    response.setHeader('content-type','text/xml');
    response.end(mockStatus===200
      ? '<SendEmailResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/"><SendEmailResult><MessageId>local-message</MessageId></SendEmailResult><ResponseMetadata><RequestId>local-request</RequestId></ResponseMetadata></SendEmailResponse>'
      : '<ErrorResponse><Error><Type>Sender</Type><Code>MessageRejected</Code><Message>Rejected locally</Message></Error><RequestId>local-request</RequestId></ErrorResponse>');
  });
  mock.listen(0,'127.0.0.1');
  await once(mock,'listening');
  mockPort=mock.address().port;
});

afterAll(async()=>{
  mock?.close();
  if (mock) await once(mock,'close');
});

describe('built Worker contact endpoint',()=>{
  it('routes through validation and the signed AWS SDK transport, including delivery failure',async()=>{
    const worker=await startWorker([
      ['AWS_ACCESS_KEY_ID','local-access'],['AWS_SECRET_ACCESS_KEY','local-secret'],
      ['EMAIL','to@example.com'],['FROM_EMAIL','from@example.com'],
      ['AWS_SES_ENDPOINT',`http://127.0.0.1:${mockPort}`],
    ]);
    try {
      const invalid=await submit(worker.origin,{...body,email:'bad'});
      expect(invalid.status).toBe(400);
      expect(signedRequests).toBe(0);

      const success=await submit(worker.origin);
      await new Promise(resolve=>setTimeout(resolve,100));
      expect(signedRequests, 'the built Worker should send a signed request to the loopback SES mock').toBe(1);
      expect(success.status, worker.output()).toBe(200);
      expect(await success.json()).toEqual({success:true});

      mockStatus=500;
      const failure=await submit(worker.origin);
      expect(failure.status).toBe(502);
      expect(await failure.json()).toEqual({success:false,errors:{form:'Message could not be sent. Please try again.'}});
    } finally {
      mockStatus=200;
      await worker.stop();
    }
  });

  it('returns 503 from the deployed route when secrets are absent',async()=>{
    const worker=await startWorker();
    try {
      const response=await submit(worker.origin);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({success:false,errors:{form:'Message service is unavailable.'}});
    } finally {
      await worker.stop();
    }
  });
});
