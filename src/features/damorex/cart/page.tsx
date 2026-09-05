import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Input,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Clock,
  Minus,
  Pill,
  Plus,
  ShoppingCart,
  Stethoscope,
  Trash2,
  Truck,
} from 'lucide-react';
import { useCartStore } from '../website/cart-store';
import { SectionHeading, ProductCard } from '../website/components';
import { EmptyCart } from '../website/empty-states';
import {
  WebsiteLayout,
  green,
  darkGreen,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';
import type { WebsiteProduct } from '../website/types';

const productPrices: Record<string, number> = {
  '1': 2500,
  '2': 3500,
  '3': 1200,
  '4': 4500,
  '5': 2800,
  '6': 1800,
  '7': 3200,
  '8': 1500,
  '9': 5200,
  '10': 900,
};

function getMockPrice(id: string): number {
  return productPrices[id] || 2500;
}

const productInfo: Record<
  string,
  { name: string; genericName: string; dosage: string; isRx: boolean }
> = {
  '1': {
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    dosage: '500mg Capsule',
    isRx: true,
  },
  '2': {
    name: 'Artemether/Lumefantrine 80/480',
    genericName: 'Artemether + Lumefantrine',
    dosage: '80mg/480mg Tablet',
    isRx: true,
  },
  '3': {
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    dosage: '500mg Tablet',
    isRx: false,
  },
  '4': { name: 'Omeprazole 20mg', genericName: 'Omeprazole', dosage: '20mg Capsule', isRx: false },
  '5': {
    name: 'Metformin 500mg',
    genericName: 'Metformin HCl',
    dosage: '500mg Tablet',
    isRx: true,
  },
  '6': { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', dosage: '400mg Tablet', isRx: false },
  '7': {
    name: 'Atorvastatin 10mg',
    genericName: 'Atorvastatin Calcium',
    dosage: '10mg Tablet',
    isRx: true,
  },
  '8': {
    name: 'Vitamin C 1000mg',
    genericName: 'Ascorbic Acid',
    dosage: '1000mg Chewable',
    isRx: false,
  },
  '9': { name: 'Lisinopril 5mg', genericName: 'Lisinopril', dosage: '5mg Tablet', isRx: true },
  '10': {
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine HCl',
    dosage: '10mg Tablet',
    isRx: false,
  },
};

function getProductName(id: string): string {
  return productInfo[id]?.name || 'Medication';
}

function getProductGeneric(id: string): string {
  return productInfo[id]?.genericName || 'Generic';
}

function getProductDosage(id: string): string {
  return productInfo[id]?.dosage || '';
}

function isRxRequired(id: string): boolean {
  return productInfo[id]?.isRx || false;
}

function cartSubtotal(items: { productId: string; quantity: number }[]): number {
  return items.reduce((sum, i) => sum + getMockPrice(i.productId) * i.quantity, 0);
}

function formatPrice(n: number): string {
  return `₦${n.toLocaleString()}`;
}

const mockFrequentlyBought: WebsiteProduct[] = [
  {
    id: 'fb1',
    name: 'Multivitamin Complex',
    code: 'MVC-001',
    barcode: null,
    category: null,
    genericProduct: {
      id: 'gp-fb1',
      name: 'Multivitamins',
      dosageForm: 'Tablet',
      strength: null,
      isPrescriptionRequired: false,
      generalUse: 'Daily nutrition',
      pharmaceutics: null,
    },
    baseUomId: 'uom-1',
    isActive: true,
    createdAt: '',
  },
  {
    id: 'fb2',
    name: 'Vitamin D3 2000IU',
    code: 'VD3-001',
    barcode: null,
    category: null,
    genericProduct: {
      id: 'gp-fb2',
      name: 'Cholecalciferol',
      dosageForm: 'Softgel',
      strength: '2000IU',
      isPrescriptionRequired: false,
      generalUse: 'Bone health',
      pharmaceutics: null,
    },
    baseUomId: 'uom-1',
    isActive: true,
    createdAt: '',
  },
  {
    id: 'fb3',
    name: 'Probiotic 30 Billion',
    code: 'PRO-001',
    barcode: null,
    category: null,
    genericProduct: {
      id: 'gp-fb3',
      name: 'Probiotic Blend',
      dosageForm: 'Capsule',
      strength: '30B CFU',
      isPrescriptionRequired: false,
      generalUse: 'Gut health',
      pharmaceutics: null,
    },
    baseUomId: 'uom-1',
    isActive: true,
    createdAt: '',
  },
];

const mockRecentlyViewed: WebsiteProduct[] = [
  {
    id: 'rv1',
    name: 'Zinc 15mg',
    code: 'ZNC-001',
    barcode: null,
    category: null,
    genericProduct: {
      id: 'gp-rv1',
      name: 'Zinc Sulfate',
      dosageForm: 'Tablet',
      strength: '15mg',
      isPrescriptionRequired: false,
      generalUse: 'Immune support',
      pharmaceutics: null,
    },
    baseUomId: 'uom-1',
    isActive: true,
    createdAt: '',
  },
  {
    id: 'rv2',
    name: 'CoQ10 100mg',
    code: 'COQ-001',
    barcode: null,
    category: null,
    genericProduct: {
      id: 'gp-rv2',
      name: 'Coenzyme Q10',
      dosageForm: 'Softgel',
      strength: '100mg',
      isPrescriptionRequired: false,
      generalUse: 'Heart health',
      pharmaceutics: null,
    },
    baseUomId: 'uom-1',
    isActive: true,
    createdAt: '',
  },
  {
    id: 'rv3',
    name: 'Omega-3 Fish Oil',
    code: 'OMG-001',
    barcode: null,
    category: null,
    genericProduct: {
      id: 'gp-rv3',
      name: 'Omega-3 Fatty Acids',
      dosageForm: 'Softgel',
      strength: '1000mg',
      isPrescriptionRequired: false,
      generalUse: 'Heart & brain health',
      pharmaceutics: null,
    },
    baseUomId: 'uom-1',
    isActive: true,
    createdAt: '',
  },
];

function CartItemRow({ productId, quantity }: { productId: string; quantity: number }) {
  const { updateQuantity, removeItem, saveForLater } = useCartStore();
  const price = getMockPrice(productId);
  const lineTotal = price * quantity;
  const rx = isRxRequired(productId);

  return (
    <Paper radius={20} p="md" withBorder style={{ borderColor: line }}>
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap" align="center">
          <Group gap="md" wrap="nowrap">
            <Image
              src="https://placehold.co/80x80/16A34A/white?text=Rx"
              alt={getProductName(productId)}
              w={72}
              h={72}
              fit="contain"
              style={{
                borderRadius: 14,
                background: '#F1F8F4',
                border: `1px solid ${line}`,
                minWidth: 72,
              }}
            />
            <Box>
              <Group gap={6} mb={2}>
                <Text fw={900} size="md">
                  {getProductName(productId)}
                </Text>
                {rx ? (
                  <Badge color="orange" variant="light" size="sm" radius="xl">
                    <Group gap={4}>
                      <Pill size={10} />
                      Rx Required
                    </Group>
                  </Badge>
                ) : null}
              </Group>
              <Text size="sm" c={muted}>
                {getProductGeneric(productId)}
              </Text>
              {getProductDosage(productId) ? (
                <Text size="xs" c={muted}>
                  {getProductDosage(productId)}
                </Text>
              ) : null}
              <Text fw={800} size="sm" c={green} mt={2}>
                {formatPrice(price)}/unit
              </Text>
            </Box>
          </Group>

          <Group gap="md" wrap="nowrap" align="center">
            <Group gap={4}>
              <ActionIcon
                radius="xl"
                variant="light"
                color="gray"
                size="sm"
                onClick={() => updateQuantity(productId, quantity - 1)}
              >
                <Minus size={14} />
              </ActionIcon>
              <Text fw={900} style={{ minWidth: 24, textAlign: 'center' }}>
                {quantity}
              </Text>
              <ActionIcon
                radius="xl"
                variant="light"
                color="gray"
                size="sm"
                onClick={() => updateQuantity(productId, quantity + 1)}
              >
                <Plus size={14} />
              </ActionIcon>
            </Group>

            <Box style={{ minWidth: 80, textAlign: 'right' }}>
              <Text fw={950} size="md">
                {formatPrice(lineTotal)}
              </Text>
            </Box>

            <Group gap={4}>
              <ActionIcon
                radius="xl"
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => saveForLater(productId)}
              >
                <Clock size={14} />
              </ActionIcon>
              <ActionIcon
                radius="xl"
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => removeItem(productId)}
              >
                <Trash2 size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Group>

        {rx ? (
          <Alert
            icon={<Stethoscope size={16} />}
            color="orange"
            variant="light"
            radius="lg"
            p="xs"
            styles={{ body: { padding: '6px 0' }, message: { fontSize: 13 } }}
          >
            This item requires a valid prescription. Our pharmacist will review your order before
            dispatch.
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}

export default function CartPage() {
  const { items, totalItems, savedForLater, moveToCart, removeSaved, clearCart } = useCartStore();
  const navigate = useNavigate();

  const subtotal = cartSubtotal(items);
  const deliveryFee = subtotal >= 10000 ? 0 : 1500;
  const total = subtotal + deliveryFee;

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="end">
            <Box>
              <Title order={1} className="damorex-heading" style={{ color: ink }}>
                Shopping Cart
              </Title>
              <Text c={muted} size="lg" lh={1.7}>
                {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
              </Text>
            </Box>
            {items.length > 0 ? (
              <Button variant="subtle" color="red" radius="xl" size="sm" onClick={clearCart}>
                Clear Cart
              </Button>
            ) : null}
          </Group>

          {!items.length ? (
            <EmptyCart />
          ) : (
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Stack gap="md">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.productId}
                      productId={item.productId}
                      quantity={item.quantity}
                    />
                  ))}

                  <Paper
                    radius={20}
                    p="md"
                    withBorder
                    style={{ borderColor: line, background: '#FFFBEB' }}
                  >
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon radius="xl" color="orange" variant="light" size="md">
                        <AlertTriangle size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={800} size="sm">
                          Drug Interaction Notice
                        </Text>
                        <Text size="xs" c={muted}>
                          Always inform your pharmacist about other medications you are taking. Some
                          medicines may interact with each other.
                        </Text>
                      </Box>
                    </Group>
                  </Paper>

                  <Paper
                    radius={20}
                    p="md"
                    withBorder
                    style={{ borderColor: line, background: '#EFF6FF' }}
                  >
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon radius="xl" color="blue" variant="light" size="md">
                        <Stethoscope size={16} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={800} size="sm">
                          Prescription Reminder
                        </Text>
                        <Text size="xs" c={muted}>
                          Have your prescription ready. Our pharmacists will validate all
                          prescription-required items before dispatch.
                        </Text>
                      </Box>
                    </Group>
                  </Paper>

                  {savedForLater.length > 0 ? (
                    <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
                      <Stack gap="md">
                        <Group gap={6}>
                          <Clock size={18} color={muted} />
                          <Text fw={900} size="md">
                            Saved for Later ({savedForLater.length})
                          </Text>
                        </Group>
                        <Divider />
                        {savedForLater.map((item) => (
                          <Group key={item.productId} justify="space-between" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap">
                              <Image
                                src="https://placehold.co/48x48/16A34A/white?text=Rx"
                                alt={getProductName(item.productId)}
                                w={44}
                                h={44}
                                fit="contain"
                                style={{
                                  borderRadius: 10,
                                  background: '#F1F8F4',
                                  border: `1px solid ${line}`,
                                }}
                              />
                              <Box>
                                <Text fw={800} size="sm">
                                  {getProductName(item.productId)}
                                </Text>
                                <Text size="xs" c={muted}>
                                  Qty: {item.quantity}
                                </Text>
                              </Box>
                            </Group>
                            <Group gap={6}>
                              <Button
                                size="xs"
                                radius="xl"
                                variant="light"
                                color="green"
                                onClick={() => moveToCart(item.productId)}
                              >
                                Move to Cart
                              </Button>
                              <Button
                                size="xs"
                                radius="xl"
                                variant="subtle"
                                color="red"
                                onClick={() => removeSaved(item.productId)}
                              >
                                Remove
                              </Button>
                            </Group>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  ) : null}

                  <Box>
                    <SectionHeading
                      eyebrow="Recommendations"
                      title="Frequently Bought Together"
                      text="Customers who bought items in your cart also purchased these"
                    />
                    <Grid mt="md">
                      {mockFrequentlyBought.map((p) => (
                        <Grid.Col key={p.id} span={{ base: 6, sm: 4 }}>
                          <ProductCard product={p} />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Box>

                  <Box>
                    <SectionHeading eyebrow="Continue browsing" title="Recently Viewed" />
                    <Grid mt="md">
                      {mockRecentlyViewed.map((p) => (
                        <Grid.Col key={p.id} span={{ base: 6, sm: 4 }}>
                          <ProductCard product={p} />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Box style={{ position: 'sticky', top: 100 }}>
                  <Paper
                    radius={24}
                    p="xl"
                    withBorder
                    style={{ borderColor: line, background: soft }}
                  >
                    <Stack gap="md">
                      <Text fw={900} size="lg">
                        Order Summary
                      </Text>
                      <Divider />

                      <Group justify="space-between">
                        <Text c={muted}>
                          Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})
                        </Text>
                        <Text fw={800}>{formatPrice(subtotal)}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c={muted}>Delivery Fee</Text>
                        <Text fw={800}>
                          {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                        </Text>
                      </Group>
                      {subtotal < 10000 && subtotal > 0 ? (
                        <Text size="xs" c={green}>
                          Add ₦{(10000 - subtotal).toLocaleString()} more for free delivery
                        </Text>
                      ) : null}
                      <Divider />
                      <Group justify="space-between">
                        <Text fw={900} size="lg">
                          Total
                        </Text>
                        <Text fw={950} size="lg" c={darkGreen}>
                          {formatPrice(total)}
                        </Text>
                      </Group>

                      <Input
                        placeholder="Enter coupon code"
                        radius="xl"
                        styles={{ input: { borderColor: line } }}
                        rightSection={
                          <Button
                            size="xs"
                            radius="xl"
                            color="green"
                            variant="light"
                            style={{ marginRight: 4 }}
                          >
                            Apply
                          </Button>
                        }
                      />

                      <Divider />

                      <Button
                        radius="xl"
                        size="lg"
                        fullWidth
                        leftSection={<ArrowRight size={20} />}
                        styles={buttonStyles}
                        style={{ background: green }}
                        onClick={() => navigate({ to: '/shop/checkout' })}
                      >
                        Proceed to Checkout
                      </Button>

                      <Group gap={6} justify="center">
                        <Truck size={14} color={muted} />
                        <Text size="xs" c={muted}>
                          Free delivery above ₦10,000
                        </Text>
                      </Group>

                      {items.some((i) => isRxRequired(i.productId)) ? (
                        <Alert
                          icon={<Stethoscope size={16} />}
                          color="orange"
                          variant="light"
                          radius="lg"
                          p="sm"
                        >
                          <Text fw={700} size="sm">
                            Prescription items in cart
                          </Text>
                          <Text size="xs">
                            You will need to validate your prescription during checkout.
                          </Text>
                        </Alert>
                      ) : null}
                    </Stack>
                  </Paper>
                </Box>
              </Grid.Col>
            </Grid>
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
