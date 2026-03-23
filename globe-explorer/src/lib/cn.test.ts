import {cn} from './cn';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('foo', undefined, 'baz')).toBe('foo baz');
    expect(cn('foo', null, 'baz')).toBe('foo baz');
  });

  it('merges conflicting tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
