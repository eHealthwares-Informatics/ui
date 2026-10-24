import {
  Badge,
  Box,
  Button,
  Center,
  Grid,
  Group,
  Image,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowRight, Boxes, ShoppingCart, Store, Tag, Truck } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../website/cart-store';
import { useProductPharmacies } from '../website/hooks';
import { buttonStyles, green, ink, line, muted, soft } from '../website/layout';
import type { PharmacyPriceView } from '../website/types';

function naira(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `₦${Number(amount).toLocaleString()}`;
}

function stockMeta(status: PharmacyPriceView['stockStatus']) {
  switch (status) {
    case 'out_of_stock':
      return { label: 'Out of stock', color: '#DC2626' };
    case 'low_stock':
      return { label: 'Low stock', color: '#D97706' };
    case 'in_stock':
      return { label: 'In stock', color: green };
    default:
      return { label: 'Available', color: muted };
  }
}

function PharmacyRow({
  pharmacy,
  productId,
  productName,
}: {
  pharmacy: PharmacyPriceView;
  productId: string;
  productName: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const stock = stockMeta(pharmacy.stockStatus);
  const outOfStock = pharmacy.stockStatus === 'out_of_stock';

  return (
    <Paper radius={16} p="md" withBorder style={{ borderColor: line, background: '#fff' }}>
      <Grid align="center">
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Group gap="sm" wrap="nowrap">
            <Box
              style={{
                width: 62,
                height: 42,
                flexShrink: 0,
                borderRadius: 8,
                background: soft,
                border: `1px solid ${line}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {pharmacy.logoUrl ? (
                <Image src={pharmacy.logoUrl} alt={pharmacy.name} h={32} w={54} fit="contain" />
              ) : (
                <ThemeIcon variant="light" color="green" radius="md" size={28}>
                  <Store size={16} />
                </ThemeIcon>
              )}
            </Box>
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={700} lineClamp={1}>
                {pharmacy.name}
              </Text>
              <Group gap={5}>
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: stock.color,
                  }}
                />
                <Text size="xs" style={{ color: stock.color }} fw={600}>
                  {stock.label}
                </Text>
              </Group>
            </Box>
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 6, md: 2 }}>
          <Text fw={800} size="md" style={{ color: ink }}>
            {naira(pharmacy.unitPrice)}
          </Text>
          <Text size="xs" c={muted}>
            per pack
          </Text>
        </Grid.Col>

        <Grid.Col span={{ base: 6, md: 3 }}>
          <Group gap={6} wrap="nowrap">
            <Truck size={15} color={muted} />
            <Box>
              <Text size="xs" c={muted}>
                Delivery
              </Text>
              <Text size="xs" fw={600} style={{ color: ink }}>
                {pharmacy.deliveryLabel}
              </Text>
            </Box>
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 6, md: 4 }}>
          <Button
            fullWidth
            radius="xl"
            size="sm"
            disabled={outOfStock}
            leftSection={<ShoppingCart size={15} />}
            styles={buttonStyles}
            style={{ background: outOfStock ? '#CBD5E1' : green }}
            onClick={() => {
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
            }}
          >
            {outOfStock ? 'Out of stock' : 'Add to Cart'}
          </Button>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}

export interface PriceAvailabilityTabProps {
  productId: string;
  productName: string;
  unitPrice: number | null;
  rating?: number | null;
  reviewCount?: number;
  onViewAll: () => void;
  enabled?: boolean;
}

/**
 * "Price & Availability" tab — aggregates the product's offers across every
 * pharmacy on the platform: the "From" summary, stock coverage, delivery
 * window, the cheapest offers as rows with Add to Cart, and a link to the full
 * Compare Prices modal.
 */
export function PriceAvailabilityTab({
  productId,
  productName,
  unitPrice,
  rating,
  reviewCount = 0,
  onViewAll,
  enabled = true,
}: PriceAvailabilityTabProps) {
  const [sortDesc, setSortDesc] = useState(false);
  const { data, isLoading } = useProductPharmacies(productId, enabled);

  const pharmacies = [...(data?.pharmacies ?? [])].sort((a, b) =>
    sortDesc ? b.unitPrice - a.unitPrice : a.unitPrice - b.unitPrice
  );
  const listed = pharmacies.slice(0, 5);
  const fromPrice = data?.lowestPrice ?? unitPrice;
  const total = data?.totalPharmacies ?? pharmacies.length;
  const inStock = data?.inStockPharmacies ?? pharmacies.length;

  if (isLoading && !data) {
    return (
      <Center py="xl">
        <Loader color="green" size="sm" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Summary card */}
      <Paper
        radius={24}
        p="lg"
        withBorder
        style={{ borderColor: '#CFE8D8', background: '#F6FBF8' }}
      >
        <Grid align="center">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Group gap="sm" align="flex-start" wrap="nowrap">
              <ThemeIcon radius="xl" size={38} variant="light" color="green">
                <Tag size={18} />
              </ThemeIcon>
              <Box>
                <Text size="sm" c={muted}>
                  From
                </Text>
                <Text fw={900} size="28px" style={{ color: green, lineHeight: 1.1 }}>
                  {naira(fromPrice)}
                </Text>
                <Text size="xs" c={muted}>
                  per pack
                </Text>
              </Box>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap={8}>
              <Group gap={8} wrap="nowrap">
                <Store size={16} color={muted} />
                <Text size="sm" fw={600}>
                  {total} pharmacies
                </Text>
                <Text size="xs" c={muted}>
                  have this product
                </Text>
              </Group>
              <Group gap={8} wrap="nowrap">
                <Boxes size={16} color={muted} />
                <Text size="sm" fw={600}>
                  {inStock > 0 ? 'In stock' : 'Out of stock'}
                </Text>
                <Text size="xs" c={muted}>
                  {inStock > 0 ? 'at most locations' : 'at all locations'}
                </Text>
              </Group>
              <Group gap={8} wrap="nowrap">
                <Truck size={16} color={muted} />
                <Text size="sm" fw={600}>
                  Delivery from
                </Text>
                <Text size="xs" c={muted}>
                  Same day – 3 days
                </Text>
              </Group>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Button
              fullWidth
              radius="xl"
              variant="outline"
              rightSection={<ArrowRight size={16} />}
              onClick={onViewAll}
              styles={buttonStyles}
              style={{ borderColor: green, color: green, background: '#fff' }}
            >
              View all prices
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Heading */}
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Group gap="sm">
          <Text fw={900} size="lg" style={{ color: ink }}>
            Available at these pharmacies
          </Text>
          <Badge radius="xl" variant="light" color="green">
            Top prices first
          </Badge>
          {rating != null ? (
            <Text size="xs" c={muted}>
              ★ {rating.toFixed(1)} ({reviewCount.toLocaleString()})
            </Text>
          ) : null}
        </Group>
        <Button
          radius="xl"
          variant="light"
          color="gray"
          size="xs"
          onClick={() => setSortDesc((v) => !v)}
        >
          Sort {sortDesc ? 'highest' : 'lowest'}
        </Button>
      </Group>

      {/* Rows */}
      {isLoading ? (
        <Center py="lg">
          <Loader color="green" size="sm" />
        </Center>
      ) : listed.length === 0 ? (
        <Paper radius={16} p="lg" withBorder style={{ borderColor: line }}>
          <Text size="sm" c={muted}>
            No pharmacies are currently listing this product.
          </Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {listed.map((pharmacy) => (
            <PharmacyRow
              key={pharmacy.organizationId}
              pharmacy={pharmacy}
              productId={productId}
              productName={productName}
            />
          ))}
        </Stack>
      )}

      {total > listed.length ? (
        <Button
          fullWidth
          radius="lg"
          variant="light"
          color="green"
          onClick={onViewAll}
          styles={buttonStyles}
          style={{ background: '#EDFBF1', color: green }}
        >
          View all {total} prices and pharmacies →
        </Button>
      ) : null}
    </Stack>
  );
}
