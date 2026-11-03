/**
 * Name parts carried by identity's access token / `/auth/me` response.
 * Every field is optional: accounts created before profiles existed, phone
 * sign-ups and the service-to-service system user have none of them.
 */
export type UserNameParts = {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** "First Last" when any part is known, otherwise the provider display name. */
export function fullNameOf(user: UserNameParts | null | undefined): string | null {
  if (!user) {
    return null;
  }
  const joined = [clean(user.firstName), clean(user.lastName)]
    .filter((part): part is string => part !== null)
    .join(' ');
  return joined || clean(user.displayName);
}

/**
 * Human-facing name with a username fallback, so callers never have to branch
 * on whether a profile was filled in. Returns `fallback` only when there is no
 * user at all (or no username either).
 */
export function displayNameOf(user: UserNameParts | null | undefined, fallback = 'User'): string {
  if (!user) {
    return fallback;
  }
  return fullNameOf(user) ?? clean(user.username) ?? fallback;
}

/** Uppercase initials for avatars: "Ada Lovelace" -> "AL", "cashier01" -> "C". */
export function initialsOf(user: UserNameParts | null | undefined, fallback = 'U'): string {
  if (!user) {
    return fallback;
  }
  const source = fullNameOf(user) ?? clean(user.username);
  if (!source) {
    return fallback;
  }
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * The greeting variant: the account name is capitalised ("cashier01" ->
 * "Cashier01") because it opens a sentence.
 */
export function greetingNameOf(user: UserNameParts | null | undefined): string {
  const name = displayNameOf(user, 'there');
  return name.charAt(0).toUpperCase() + name.slice(1);
}
