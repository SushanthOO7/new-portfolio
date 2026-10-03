export const CONTACT_LIMITS = Object.freeze({ email: 512, message: 4096, body: 8192 });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(input = {}) {
  const value = {
    name: String(input.name ?? '').trim(),
    email: String(input.email ?? '').trim(),
    message: String(input.message ?? '').trim(),
  };
  const errors = {};

  if (!value.email || !EMAIL_PATTERN.test(value.email)) errors.email = 'Please enter a valid email address.';
  if (value.email.length > CONTACT_LIMITS.email) errors.email = 'Email address must be 512 characters or fewer.';
  if (!value.message) errors.message = 'Please enter a message.';
  if (value.message.length > CONTACT_LIMITS.message) errors.message = 'Message must be 4096 characters or fewer.';

  return { value, errors };
}
