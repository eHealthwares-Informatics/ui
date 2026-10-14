import { createFileRoute } from '@tanstack/react-router';
import { RxItemsPage } from '@/features/rxsoft/pages';

// `/rxsoft/products` was a declared route (module-data routes array + the
// rxsoft#72 Products UC) with no route file, so it 404'd. The `products/` page
// module IS the Items implementation (`RxItemsPage` backed by `itemsConfig`),
// so Products and Items are the same surface — this wires the alias the ticket
// asked for rather than forking a second page.
export const Route = createFileRoute('/_authenticated/rxsoft/products/')({
  component: RxItemsPage,
});
