import ShopPage from './page';

/**
 * "Shop Supermarket Items" — the shop listing scoped to supermarket/grocery
 * categories. Reuses the full /shop/shop filtering surface (search, category,
 * sort, pagination); only the preset category filter and heading differ.
 * The preset is resolved against live catalog categories, so the exact
 * category name is managed in the catalog, not hardcoded here.
 */
export default function SupermarketPage() {
  return (
    <ShopPage
      presetCategory="supermarket"
      defaultSort="generic"
      heading="Shop Supermarket Items"
      subheading="Everyday essentials and grocery items, with the same trusted delivery."
    />
  );
}
