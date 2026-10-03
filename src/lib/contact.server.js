import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { CONTACT_LIMITS, validateContact } from './contact.js';

const REQUIRED_ENV = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'EMAIL', 'FROM_EMAIL'];
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

function json(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers });
}

async function parseBody(request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > CONTACT_LIMITS.body) return { oversized: true };
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > CONTACT_LIMITS.body) return { oversized: true };
  try {
    if (request.headers.get('content-type')?.includes('application/json')) return { value: JSON.parse(raw) };
    return { value: Object.fromEntries(new URLSearchParams(raw)) };
  } catch {
    return { invalid: true };
  }
}

export function createContactHandler({ sendEmail, env, logger = console }) {
  return async request => {
    if (request.signal.aborted) return json({ success: false, errors: { form: 'Request was cancelled.' } }, 499);

    const parsed = await parseBody(request);
    if (parsed.oversized) return json({ success: false, errors: { form: 'Request body is too large.' } }, 413);
    if (parsed.invalid) return json({ success: false, errors: { form: 'Invalid request body.' } }, 400);

    const { value, errors } = validateContact(parsed.value);
    if (value.name) return json({ success: true }, 200);
    if (Object.keys(errors).length) return json({ success: false, errors }, 400);

    if (REQUIRED_ENV.some(key => !env?.[key])) {
      logger.error('contact_configuration_unavailable');
      return json({ success: false, errors: { form: 'Message service is unavailable.' } }, 503);
    }
    if (request.signal.aborted) return json({ success: false, errors: { form: 'Request was cancelled.' } }, 499);

    try {
      await sendEmail({ email: value.email, message: value.message });
      return json({ success: true }, 200);
    } catch {
      logger.error('contact_delivery_failed');
      return json({ success: false, errors: { form: 'Message could not be sent. Please try again.' } }, 502);
    }
  };
}

export function createSesSender(env) {
  const client = new SESClient({
    region: 'us-east-1',
    credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
  });
  return ({ email, message }) => client.send(new SendEmailCommand({
    Destination: { ToAddresses: [env.EMAIL] },
    Message: {
      Body: { Text: { Data: `From: ${email}\n\n${message}` } },
      Subject: { Data: `Portfolio message from ${email}` },
    },
    Source: `Portfolio <${env.FROM_EMAIL}>`,
    ReplyToAddresses: [email],
  }));
}
