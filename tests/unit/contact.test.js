import { describe, expect, it } from 'vitest';
import { validateContact } from '../../src/lib/contact.js';

describe('validateContact', () => {
  it('accepts a valid message and normalizes surrounding whitespace', () => {
    expect(validateContact({ name: '', email: '  person@example.com ', message: ' Hello there. ' })).toEqual({
      value: { name: '', email: 'person@example.com', message: 'Hello there.' },
      errors: {},
    });
  });

  it.each([
    [{ email: '', message: 'Hello' }, 'Please enter a valid email address.'],
    [{ email: 'broken', message: 'Hello' }, 'Please enter a valid email address.'],
    [{ email: `${'a'.repeat(501)}@example.com`, message: 'Hello' }, 'Email address must be 512 characters or fewer.'],
  ])('rejects malformed, missing, and oversized email values', (input, expected) => {
    expect(validateContact({ name: '', ...input }).errors.email).toBe(expected);
  });

  it.each([
    ['', 'Please enter a message.'],
    ['a'.repeat(4097), 'Message must be 4096 characters or fewer.'],
  ])('rejects missing and oversized messages', (message, expected) => {
    expect(validateContact({ name: '', email: 'person@example.com', message }).errors.message).toBe(expected);
  });
});
