import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Check, ShoppingBag, ShoppingCart, Star, Store, Tag, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from './cart-store';
import { useProductPharmacies } from './hooks';
import { buttonStyles, darkGreen, green, ink, line, muted, soft } from './layout';
import type { PharmacyPriceView } from './types';

function naira(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `₦${Number(amount).toLocaleString()}`;
}

function stockMeta(status: PharmacyPriceView['stockStatus']) {
  switch (status) {
    case 'out_of_stock':
      return { label: 'Out of stock', color: '#DC2626', bg: '#FEF2F2' };
    case 'low_stock':
      return { label: 'Low stock', color: '#D97706', bg: '#FFF7ED' };
    case 'in_stock':
      return { label: 'In stock', color: green, bg: '#F0FDF4' };
    default:
      return { label: 'Available', color: muted, bg: '#F1F5F9' };
  }
}

function PharmacyCard({
  pharmacy,
  productId,
  productName,
  onSelect,
}: {
  pharmacy: PharmacyPriceView;
  productId: string;
  productName: string;
  onSelect?: (offer: PharmacyPriceView) => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const stock = stockMeta(pharmacy.stockStatus);
  const outOfStock = pharmacy.stockStatus === 'out_of_stock';

  const select = () => {
    addItem(productId, 1, {
      name: productName,
      unitPrice: pharmacy.unitPrice,
      priceListId: pharmacy.priceListId,
      pharmacyOrganizationId: pharmacy.organizationId,
      pharmacyName: pharmacy.name,
    });
    const count = useCartStore.getState().totalItems;
    notifications.show({
      position: 'bottom-right',
      title: 'Added to cart',
      message: `${count} item${count === 1 ? '' : 's'} — ${productName} from ${pharmacy.name}`,
      color: 'green',
      icon: <ShoppingCart size={18} />,
    });
    onSelect?.(pharmacy);
  };

  return (
    <Paper radius={16} p="md" withBorder style={{ borderColor: line, background: '#fff' }}>
      <Stack gap="sm">
        {/* Header: logo + name/rating/stock */}
        <Group align="flex-start" wrap="nowrap" gap="md">
          <Box
            style={{
              width: 74,
              height: 48,
              flexShrink: 0,
              borderRadius: 10,
              background: soft,
              border: `1px solid ${line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {pharmacy.logoUrl ? (
              <Image src={pharmacy.logoUrl} alt={pharmacy.name} h={38} w={66} fit="contain" />
            ) : (
              <ThemeIcon variant="light" color="green" radius="md" size={32}>
                <Store size={18} />
              </ThemeIcon>
            )}
          </Box>

          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={8} wrap="nowrap">
              <Text fw={800} size="sm" lineClamp={1}>
                {pharmacy.priceListName ?? pharmacy.name}
              </Text>
              {pharmacy.isCurrentOrg ? (
                <Badge size="xs" radius="xl" variant="light" color="green">
                  You
                </Badge>
              ) : null}
            </Group>
            <Group gap={6}>
              <Box
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 99,
                  background: stock.color,
                  flexShrink: 0,
                }}
              />
              <Text size="xs" fw={600} style={{ color: stock.color }}>
                {stock.label}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Divider color={line} />

        {/* Footer: price + delivery + select */}
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Box>
            <Text fw={900} size="xl" style={{ color: ink, lineHeight: 1.1 }}>
              {naira(pharmacy.unitPrice)}
            </Text>
            <Text size="xs" c={muted}>
              per pack
            </Text>
          </Box>

          <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Truck size={15} color={muted} />
            <Text size="xs" c={muted}>
              {pharmacy.deliveryLabel}
            </Text>
          </Group>

          <Button
            radius="xl"
            size="sm"
            disabled={outOfStock}
            onClick={select}
            leftSection={<Check size={15} />}
            styles={buttonStyles}
            style={{ background: outOfStock ? '#CBD5E1' : green, minWidth: 92 }}
          >
            Select
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export interface ComparePricesModalProps {
  opened: boolean;
  onClose: () => void;
  productId: string;
  productName?: string;
  /** Fired when a shopper selects a price list offer, so the product detail
   *  page can reflect the chosen price/price list. */
  onPriceSelected?: (offer: PharmacyPriceView) => void;
}

/**
 * "Compare Prices" modal — the shopper-facing price comparison across every
 * pharmacy on the platform that sells the product (price, stock, delivery),
 * with a "Top offers" (cheapest 5) / "All N prices" segmented control.
 */
export function ComparePricesModal({
  opened,
  onClose,
  productId,
  productName,
  onPriceSelected,
}: ComparePricesModalProps) {
  const [tab, setTab] = useState<'top' | 'all'>('top');
  const { data, isLoading } = useProductPharmacies(productId, opened);

  useEffect(() => {
    if (opened) setTab('top');
  }, [opened]);

  const pharmacies = data?.pharmacies ?? [];
  const topOffers = pharmacies.slice(0, 5);
  const shown = tab === 'top' ? topOffers : pharmacies;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      size={480}
      radius={24}
      padding={0}
      overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
      styles={{ body: { padding: 0 } }}
    >
      <Box p="lg" style={{ background: '#fff' }}>
        {/* Header */}
        <Group justify="space-between" align="flex-start" wrap="nowrap" mb={4}>
          <Group gap="sm" wrap="nowrap" align="center">
            <ThemeIcon radius="xl" size={38} variant="light" color="green">
              <Tag size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={900} size="xl" style={{ color: ink, letterSpacing: '-0.02em' }}>
                Compare Prices
              </Text>
              <Text size="sm" c={muted}>
                {isLoading
                  ? 'Finding pharmacies…'
                  : `Available from ${data?.totalPharmacies ?? 0} pharmac${
                      (data?.totalPharmacies ?? 0) === 1 ? 'y' : 'ies'
                    }`}
              </Text>
              {!isLoading && data?.rating != null ? (
                <Group gap={5} mt={2}>
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                  <Text size="xs" fw={700} style={{ color: ink }}>
                    {data.rating.toFixed(1)}
                  </Text>
                  <Text size="xs" c={muted}>
                    ({data.reviewCount.toLocaleString()} reviews)
                  </Text>
                </Group>
              ) : null}
            </Box>
          </Group>
          <Button
            variant="subtle"
            color="gray"
            p={6}
            radius="xl"
            onClick={onClose}
            aria-label="Close compare prices"
          >
            <X size={20} />
          </Button>
        </Group>

        {/* Segmented control */}
        <Box
          mt="md"
          p={4}
          style={{ background: '#F3F4F6', borderRadius: 999, display: 'inline-flex', gap: 4 }}
        >
          {(
            [
              { id: 'top' as const, label: 'Top offers' },
              { id: 'all' as const, label: `All ${data?.totalPharmacies ?? 0} prices` },
            ] as const
          ).map((option) => {
            const active = tab === option.id;
            return (
              <Button
                key={option.id}
                radius="xl"
                size="xs"
                px="md"
                onClick={() => setTab(option.id)}
                styles={buttonStyles}
                style={{
                  background: active ? green : 'transparent',
                  color: active ? '#fff' : muted,
                  fontWeight: 700,
                }}
              >
                {option.label}
              </Button>
            );
          })}
        </Box>

        {/* Offers */}
        <ScrollArea.Autosize mah="58vh" mt="md" type="scroll" offsetScrollbars>
          {isLoading ? (
            <Center py="xl">
              <Loader color="green" size="sm" />
            </Center>
          ) : shown.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap={6}>
                <ThemeIcon variant="light" color="gray" radius="xl" size={40}>
                  <ShoppingBag size={20} />
                </ThemeIcon>
                <Text size="sm" c={muted}>
                  No pharmacies are currently listing this product.
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="sm" pr={4}>
              {shown.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy.organizationId}
                  pharmacy={pharmacy}
                  productId={productId}
                  productName={productName ?? data?.productName ?? 'Product'}
                  onSelect={(offer) => {
                    onPriceSelected?.(offer);
                    onClose();
                  }}
                />
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>

        {/* Footer */}
        {pharmacies.length > topOffers.length ? (
          <Button
            fullWidth
            mt="md"
            radius="lg"
            variant="light"
            color="green"
            onClick={() => setTab(tab === 'top' ? 'all' : 'top')}
            styles={buttonStyles}
            style={{ background: '#EDFBF1', color: darkGreen }}
          >
            {tab === 'top'
              ? `View all ${pharmacies.length} prices and pharmacies →`
              : 'Show top offers'}
          </Button>
        ) : null}
      </Box>
    </Modal>
  );
}
