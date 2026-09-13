import { createFileRoute } from '@tanstack/react-router';
import ShopMedicinesPage from '@/features/shop/shop/medicines';

export const Route = createFileRoute('/shop/medicines')({
  component: ShopMedicinesPage,
});