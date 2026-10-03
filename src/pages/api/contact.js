import { createContactHandler, createSesSender } from '../../lib/contact.server.js';

export const prerender = false;

export async function POST({ request, locals }) {
  const env = locals.runtime?.env ?? {};
  return createContactHandler({ sendEmail: createSesSender(env), env, logger: console })(request);
}

export function ALL() {
  return new Response(JSON.stringify({ success: false, errors: { form: 'Method not allowed.' } }), {
    status: 405,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', allow: 'POST' },
  });
}
