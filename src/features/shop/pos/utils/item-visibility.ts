/**
 * Organisation visibility of a catalog item (the backend's `visibility` field).
 *
 * `whitelisted` means the organisation has an active `organisation_items` row
 * and can sell the item. `default` is catalog-only, `blacklisted` is explicitly
 * excluded from the organisation.
 */
export type ItemVisibility = 'default' | 'whitelisted' | 'blacklisted';

/**
 * Whether the POS must ask before putting this item on the cart.
 *
 * Only `whitelisted` items are sellable — anything else has no organisation row,
 * so the sale would fail at the till. Unknown visibility (e.g. an item just
 * quick-created for this organisation, where we only have id/name/code back) is
 * treated as fine, because prompting on a value we don't have would block the
 * common path (rxsoft-qa#806).
 */
export function needsOrganisationActivation(
  visibility: ItemVisibility | string | null | undefined
): boolean {
  return Boolean(visibility) && visibility !== 'whitelisted';
}
