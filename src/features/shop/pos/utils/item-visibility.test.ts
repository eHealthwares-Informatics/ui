import { needsOrganisationActivation } from './item-visibility';

/**
 * rxsoft-qa#806 — the POS must ask before selling an item the organisation has
 * not added to its catalogue (no `organisation_items` row).
 */
describe('needsOrganisationActivation', () => {
  it('does not prompt for an item the organisation has added', () => {
    expect(needsOrganisationActivation('whitelisted')).toBe(false);
  });

  it('prompts for a catalog default (never added to the organisation)', () => {
    expect(needsOrganisationActivation('default')).toBe(true);
  });

  it('prompts for a blacklisted item before it can be sold', () => {
    expect(needsOrganisationActivation('blacklisted')).toBe(true);
  });

  it('does not prompt when visibility is unknown', () => {
    // e.g. an item just quick-created for this organisation — we only get
    // id/name/code back, and prompting on a missing value would block the path.
    expect(needsOrganisationActivation(undefined)).toBe(false);
    expect(needsOrganisationActivation(null)).toBe(false);
    expect(needsOrganisationActivation('')).toBe(false);
  });
});
