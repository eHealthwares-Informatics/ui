import { describe, expect, it } from 'vitest';
import { displayNameOf, fullNameOf, greetingNameOf, initialsOf } from './user-name';

describe('user-name', () => {
  it('joins first and last name', () => {
    expect(fullNameOf({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada Lovelace');
    expect(displayNameOf({ username: 'ada', firstName: 'Ada', lastName: 'Lovelace' })).toBe(
      'Ada Lovelace'
    );
  });

  it('falls back to the provider display name, then the username', () => {
    expect(displayNameOf({ username: 'ada', displayName: 'Ada L.' })).toBe('Ada L.');
    expect(displayNameOf({ username: 'cashier01' })).toBe('cashier01');
  });

  it('falls back again when the account has no username', () => {
    expect(displayNameOf({ firstName: '   ', lastName: '' }, 'RxSoft User')).toBe('RxSoft User');
    expect(displayNameOf(null, 'User')).toBe('User');
  });

  it('uses the name parts that exist', () => {
    expect(fullNameOf({ firstName: 'Ada', lastName: '  ' })).toBe('Ada');
  });

  it('builds initials from the name, else the username', () => {
    expect(initialsOf({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('AL');
    expect(initialsOf({ username: 'cashier01' })).toBe('C');
    expect(initialsOf(null)).toBe('U');
  });

  it('capitalises the greeting name', () => {
    expect(greetingNameOf({ username: 'cashier01' })).toBe('Cashier01');
    expect(greetingNameOf({ username: 'ada', firstName: 'ada', lastName: 'lovelace' })).toBe(
      'Ada lovelace'
    );
  });
});
