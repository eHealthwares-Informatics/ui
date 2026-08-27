import {
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
  Progress,
  Radio,
  Select,
  Stack,
  Stepper,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  FileUp,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { useChatbotStore } from '../website/chatbot-store';
import {
  toHL7Prescription,
  buildWhatsAppUrl,
  WEBSITE_PRESCRIPTION_PHONE,
  QUESTIONNAIRE_CODES,
} from '../website/hl7-prescription';
import { useAuthStore } from '../website/auth-store';
import { useCartStore } from '../website/cart-store';
import { useCreateOrder, useDeliveryAreas } from '../website/hooks';
import { useWebPaymentProviders, useInitializeWebPayment } from '../api/posApi';
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
import type { OrderView, DeliveryAreaView } from '../website/types';

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

function isRxRequired(id: string): boolean {
  return productInfo[id]?.isRx || false;
}

function getMockPrice2(id: string): number {
  return productPrices[id] || 2500;
}

function formatPrice(n: number): string {
  return `₦${n.toLocaleString()}`;
}

const mockDeliveryAreas: DeliveryAreaView[] = [
  {
    id: 'da-1',
    state: 'Lagos',
    city: 'Ikeja',
    deliveryFee: 1000,
    minOrderAmount: 0,
    freeDeliveryAbove: 10000,
    estimatedDeliveryHours: 24,
  },
  {
    id: 'da-2',
    state: 'Lagos',
    city: 'Lekki',
    deliveryFee: 1500,
    minOrderAmount: 0,
    freeDeliveryAbove: 10000,
    estimatedDeliveryHours: 48,
  },
  {
    id: 'da-3',
    state: 'Lagos',
    city: 'Victoria Island',
    deliveryFee: 1500,
    minOrderAmount: 0,
    freeDeliveryAbove: 10000,
    estimatedDeliveryHours: 24,
  },
  {
    id: 'da-4',
    state: 'Ogun',
    city: 'Abeokuta',
    deliveryFee: 2000,
    minOrderAmount: 0,
    freeDeliveryAbove: 15000,
    estimatedDeliveryHours: 72,
  },
  {
    id: 'da-5',
    state: 'Oyo',
    city: 'Ibadan',
    deliveryFee: 2000,
    minOrderAmount: 0,
    freeDeliveryAbove: 15000,
    estimatedDeliveryHours: 72,
  },
];

export default function CheckoutPage() {
  const { items, totalItems, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { mutate: placeOrder, isPending } = useCreateOrder();
  const { data: deliveryAreasData, isLoading: areasLoading } = useDeliveryAreas();
  const { data: providers = [] } = useWebPaymentProviders('web');
  const initialize = useInitializeWebPayment();
  const navigate = useNavigate();

  const deliveryAreas =
    deliveryAreasData && deliveryAreasData.length > 0 ? deliveryAreasData : mockDeliveryAreas;

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state_, setState_] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAreaId, setDeliveryAreaId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(
    providers[0]?.id ?? null
  );
  const [promoCode, setPromoCode] = useState('');
  const [placedOrder, setPlacedOrder] = useState<OrderView | null>(null);

  const selectedArea = deliveryAreas.find((a) => a.id === deliveryAreaId);

  const subtotal = items.reduce((sum, i) => sum + getMockPrice2(i.productId) * i.quantity, 0);
  const deliveryFee = selectedArea
    ? subtotal >= (selectedArea.freeDeliveryAbove || Infinity)
      ? 0
      : selectedArea.deliveryFee
    : subtotal >= 10000
      ? 0
      : 1500;
  const total = subtotal + deliveryFee;
  const rxItems = items.filter((i) => isRxRequired(i.productId));

  const canGoNext = () => {
    switch (step) {
      case 0:
        return items.length > 0;
      case 1:
        return !!address && !!city && !!state_ && !!phone && !!deliveryAreaId;
      case 2:
        return true;
      case 3:
        return !!paymentMethod;
      default:
        return true;
    }
  };

  const handlePlaceOrder = () => {
    placeOrder(
      {
        paymentMethod: providers.find((p) => p.id === paymentMethod)?.name || 'Card',
        notes: promoCode ? `Promo: ${promoCode}` : undefined,
        items: items.map((i) => ({
          itemId: i.productId,
          quantity: i.quantity,
          unitPrice: getMockPrice2(i.productId),
        })),
        delivery: {
          address,
          city,
          state: state_,
          phone,
          shippingMethod: 'standard',
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          setPlacedOrder(order);
          // Kick off gateway payment for the newly created order.
          initialize.mutate(
            {
              amount: total,
              sourceType: 'order',
              sourceId: order.id,
              providerId: paymentMethod,
              returnUrl: `${window.location.origin}/damorex/pay/checkout-return?order=${order.id}`,
            },
            {
              onSuccess: (res) => {
                if (res.checkoutUrl) {
                  window.location.href = res.checkoutUrl;
                }
                setStep(4);
              },
              onError: () => setStep(4),
            }
          );
        },
        onError: () => {
          setStep(4);
          setPlacedOrder({
            id: 'ERR',
            orderNumber: `DMX-${Date.now().toString(36).toUpperCase()}`,
            customerId: null,
            paymentMethod: providers.find((p) => p.id === paymentMethod)?.name || 'Card',
            orderStatus: 'pending',
            notes: null,
            saleId: null,
            createdBy: null,
            subtotalAmount: 0,
            totalAmount: 0,
            createdAt: new Date().toISOString(),
            items: [],
            delivery: {
              id: '',
              address,
              city,
              state: state_,
              phone,
              shippingMethod: 'standard',
              trackingNumber: null,
              status: 'pending',
              notes: null,
            },
          });
        },
      }
    );
  };

  if (step === 4 && placedOrder) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={80}>
          <Paper radius={30} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <ThemeIcon radius="xl" size={72} color="green" mx="auto" style={{ background: green }}>
              <Check size={36} />
            </ThemeIcon>
            <Title order={2} className="damorex-heading" mt="lg">
              Order Placed!
            </Title>
            <Text c={muted} lh={1.7} mt="sm" maw={420} mx="auto">
              Your order has been placed successfully. You&apos;ll receive tracking updates via SMS
              and WhatsApp.
            </Text>

            <Paper
              radius={16}
              p="md"
              mt="lg"
              withBorder
              style={{ borderColor: line, background: soft, display: 'inline-block' }}
            >
              <Stack gap={4} align="center">
                <Text size="xs" c={muted} tt="uppercase" fw={700}>
                  Order Number
                </Text>
                <Text fw={950} size="xl" style={{ color: darkGreen, letterSpacing: '0.02em' }}>
                  {placedOrder.orderNumber}
                </Text>
              </Stack>
            </Paper>

            {selectedArea ? (
              <Group justify="center" mt="md" gap="xs">
                <Truck size={14} color={muted} />
                <Text size="sm" c={muted}>
                  Estimated delivery: {selectedArea.estimatedDeliveryHours || 48} hours
                </Text>
              </Group>
            ) : null}

            <Group justify="center" mt="xl">
              <Button
                radius="xl"
                color="green"
                styles={buttonStyles}
                style={{ background: green }}
                leftSection={<Package size={18} />}
                onClick={() => navigate({ to: '/damorex/orders' })}
              >
                Track Order
              </Button>
              <Button
                radius="xl"
                variant="light"
                color="green"
                leftSection={<ShoppingBag size={18} />}
                onClick={() => navigate({ to: '/damorex/shop' })}
              >
                Continue Shopping
              </Button>
            </Group>
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Checkout
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              {totalItems} item{totalItems !== 1 ? 's' : ''} &middot; Complete your order
            </Text>
          </Box>

          <Stepper
            active={step}
            onStepClick={setStep}
            color="green"
            radius="lg"
            size="sm"
            allowNextStepsSelect={false}
          >
            <Stepper.Step label="Cart Review" description="Review items">
              {/* No content here - rendered separately */}
            </Stepper.Step>
            <Stepper.Step label="Delivery" description="Address & area" />
            <Stepper.Step label="Prescription" description="Validate Rx" />
            <Stepper.Step label="Payment" description="Pay" />
            <Stepper.Step label="Confirmation" description="Done" />
          </Stepper>

          <Progress value={((step + 1) / 5) * 100} color="green" size="sm" radius="xl" />

          {!isAuthenticated ? (
            <Paper radius={24} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
              <ThemeIcon radius="xl" size={56} color="green" variant="light" mx="auto">
                <ShoppingCart size={24} />
              </ThemeIcon>
              <Text fw={900} mt="md" size="lg">
                Sign in to continue
              </Text>
              <Text c={muted} size="sm" mt={4}>
                Please sign in to proceed with checkout.
              </Text>
              <Button
                radius="xl"
                mt="lg"
                color="green"
                styles={buttonStyles}
                style={{ background: green }}
                onClick={() => navigate({ to: '/damorex/login' })}
              >
                Sign In
              </Button>
            </Paper>
          ) : (
            <>
              {step === 0 && (
                <StepCartReview items={items} subtotal={subtotal} totalItems={totalItems} />
              )}

              {step === 1 && (
                <StepDeliveryDetails
                  address={address}
                  setAddress={setAddress}
                  city={city}
                  setCity={setCity}
                  state_={state_}
                  setState_={setState_}
                  phone={phone}
                  setPhone={setPhone}
                  deliveryAreaId={deliveryAreaId}
                  setDeliveryAreaId={setDeliveryAreaId}
                  deliveryAreas={deliveryAreas}
                  areasLoading={areasLoading}
                  selectedArea={selectedArea}
                  items={items}
                />
              )}

              {step === 2 && <StepPrescriptionValidation rxItems={rxItems} />}

              {step === 3 && (
                <StepPayment
                  providers={providers}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  promoCode={promoCode}
                  setPromoCode={setPromoCode}
                  items={items}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  total={total}
                  totalItems={totalItems}
                />
              )}
            </>
          )}

          {isAuthenticated && step < 4 ? (
            <Group justify="space-between" mt="lg">
              <Button
                radius="xl"
                variant="light"
                color="gray"
                leftSection={<ArrowLeft size={18} />}
                onClick={() => {
                  if (step === 0) {navigate({ to: '/damorex/cart' });}
                  else {setStep(step - 1);}
                }}
                disabled={step === 3 && isPending}
              >
                {step === 0 ? 'Back to Cart' : 'Previous'}
              </Button>

              {step < 3 ? (
                <Button
                  radius="xl"
                  color="green"
                  rightSection={<ArrowRight size={18} />}
                  styles={buttonStyles}
                  style={{ background: green }}
                  onClick={() => setStep(step + 1)}
                  disabled={!canGoNext()}
                >
                  Continue
                </Button>
              ) : step === 3 ? (
                <Button
                  radius="xl"
                  size="lg"
                  color="green"
                  leftSection={<CreditCard size={18} />}
                  styles={buttonStyles}
                  style={{ background: green }}
                  onClick={handlePlaceOrder}
                  loading={isPending}
                  disabled={!canGoNext()}
                >
                  Place Order &middot; {formatPrice(total)}
                </Button>
              ) : null}
            </Group>
          ) : null}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}

function StepCartReview({
  items,
  subtotal,
  totalItems,
}: {
  items: { productId: string; quantity: number }[];
  subtotal: number;
  totalItems: number;
}) {
  return (
    <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
      <Stack gap="md">
        <Group gap={6}>
          <ShoppingCart size={20} color={green} />
          <Text fw={900} size="lg">
            Cart Review
          </Text>
        </Group>
        <Divider />

        {items.map((item) => {
          const rx = isRxRequired(item.productId);
          const price = getMockPrice2(item.productId);
          return (
            <Group key={item.productId} justify="space-between" wrap="nowrap">
              <Group gap="md" wrap="nowrap">
                <Image
                  src="https://placehold.co/56x56/16A34A/white?text=Rx"
                  alt={getProductName(item.productId)}
                  w={48}
                  h={48}
                  fit="contain"
                  style={{
                    borderRadius: 10,
                    background: '#F1F8F4',
                    border: `1px solid ${line}`,
                  }}
                />
                <Box>
                  <Group gap={4}>
                    <Text fw={800} size="sm">
                      {getProductName(item.productId)}
                    </Text>
                    {rx ? (
                      <Badge color="orange" variant="light" size="xs" radius="xl">
                        <Pill size={8} /> Rx
                      </Badge>
                    ) : null}
                  </Group>
                  <Text size="xs" c={muted}>
                    {getProductGeneric(item.productId)}
                  </Text>
                </Box>
              </Group>
              <Group gap="lg" wrap="nowrap">
                <Text size="sm" c={muted}>
                  x{item.quantity}
                </Text>
                <Text fw={800} style={{ minWidth: 70, textAlign: 'right' }}>
                  {formatPrice(price * item.quantity)}
                </Text>
              </Group>
            </Group>
          );
        })}

        <Divider />
        <Group justify="space-between">
          <Text c={muted}>Subtotal ({totalItems} items)</Text>
          <Text fw={800}>{formatPrice(subtotal)}</Text>
        </Group>
      </Stack>
    </Paper>
  );
}

function StepDeliveryDetails({
  address,
  setAddress,
  city,
  setCity,
  state_,
  setState_,
  phone,
  setPhone,
  deliveryAreaId,
  setDeliveryAreaId,
  deliveryAreas,
  areasLoading,
  selectedArea,
  items,
}: {
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state_: string;
  setState_: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  deliveryAreaId: string | null;
  setDeliveryAreaId: (v: string | null) => void;
  deliveryAreas: DeliveryAreaView[];
  areasLoading: boolean;
  selectedArea: DeliveryAreaView | undefined;
  items: { productId: string; quantity: number }[];
}) {
  return (
    <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
      <Stack gap="md">
        <Group gap={6}>
          <MapPin size={20} color={green} />
          <Text fw={900} size="lg">
            Delivery Details
          </Text>
        </Group>
        <Divider />

        <TextInput
          label="Street Address"
          placeholder="House number, street name"
          radius="xl"
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
          styles={{ input: { borderColor: line } }}
        />

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="City"
              placeholder="Lagos"
              radius="xl"
              value={city}
              onChange={(e) => setCity(e.currentTarget.value)}
              styles={{ input: { borderColor: line } }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="State"
              placeholder="Lagos"
              radius="xl"
              value={state_}
              onChange={(e) => setState_(e.currentTarget.value)}
              styles={{ input: { borderColor: line } }}
            />
          </Grid.Col>
        </Grid>

        <TextInput
          label="Phone Number"
          placeholder="+234 800 000 0000"
          radius="xl"
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          styles={{ input: { borderColor: line } }}
        />

        <Select
          label="Delivery Area"
          placeholder={areasLoading ? 'Loading areas...' : 'Select your delivery area'}
          data={deliveryAreas.map((a) => ({
            value: a.id,
            label: `${a.city}, ${a.state} — ${formatPrice(a.deliveryFee)} fee`,
          }))}
          value={deliveryAreaId}
          onChange={setDeliveryAreaId}
          radius="xl"
          searchable
          nothingFoundMessage="No areas found"
        />

        {selectedArea ? (
          <Paper radius={16} p="md" withBorder style={{ borderColor: line, background: soft }}>
            <Group gap="md">
              <ThemeIcon radius="xl" color="green" variant="light" size="md">
                <Truck size={16} />
              </ThemeIcon>
              <Box>
                <Text fw={800} size="sm">
                  Estimated Delivery Time
                </Text>
                <Text size="sm" c={muted}>
                  {selectedArea.estimatedDeliveryHours
                    ? `${selectedArea.estimatedDeliveryHours} hours`
                    : '1-3 business days'}
                </Text>
                {selectedArea.freeDeliveryAbove &&
                subtotalValue(items) >= selectedArea.freeDeliveryAbove ? (
                  <Text size="xs" c={green}>
                    Free delivery applies
                  </Text>
                ) : null}
              </Box>
            </Group>
          </Paper>
        ) : null}

        {!areasLoading && deliveryAreas.length === 0 ? (
          <Alert icon={<AlertTriangle size={16} />} color="orange" variant="light" radius="lg">
            No delivery areas loaded. Using default rates.
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}

function subtotalValue(items: { productId: string; quantity: number }[]): number {
  return items.reduce((sum, i) => sum + getMockPrice2(i.productId) * i.quantity, 0);
}

function StepPrescriptionValidation({
  rxItems,
}: {
  rxItems: { productId: string; quantity: number }[];
}) {
  const navigate = useNavigate();

  return (
    <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
      <Stack gap="md">
        <Group gap={6}>
          <Stethoscope size={20} color={green} />
          <Text fw={900} size="lg">
            Prescription Validation
          </Text>
        </Group>
        <Divider />

        {rxItems.length === 0 ? (
          <Paper radius={16} p="md" withBorder style={{ borderColor: line, background: soft }}>
            <Group gap="sm">
              <ThemeIcon radius="xl" color="green" variant="light" size="md">
                <Check size={16} />
              </ThemeIcon>
              <Box>
                <Text fw={800} size="sm">
                  No prescription-required items
                </Text>
                <Text size="xs" c={muted}>
                  All items in your cart are over-the-counter.
                </Text>
              </Box>
            </Group>
          </Paper>
        ) : (
          <>
            <Text size="sm" c={muted}>
              The following items require a valid prescription. Please upload your prescription or
              contact a pharmacist for assistance.
            </Text>

            {rxItems.map((item) => (
              <Group key={item.productId} justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon radius="xl" color="orange" variant="light" size="md">
                    <Pill size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={800} size="sm">
                      {getProductName(item.productId)}
                    </Text>
                    <Text size="xs" c={muted}>
                      Qty: {item.quantity}
                    </Text>
                  </Box>
                </Group>
                <Badge color="orange" variant="light" radius="xl">
                  Prescription Required
                </Badge>
              </Group>
            ))}

            <Divider />

            <Group>
              <Button
                radius="xl"
                color="green"
                leftSection={<FileUp size={18} />}
                styles={buttonStyles}
                style={{ background: green }}
                onClick={() => navigate({ to: '/damorex/upload-prescription' })}
              >
                Upload Prescription
              </Button>
              <Button
                radius="xl"
                variant="light"
                color="green"
                leftSection={<MessageCircle size={18} />}
                onClick={() => {
                  const cart = useCartStore.getState().items;
                  const products = cart
                    .map((ci) => ci.product)
                    .filter(Boolean) as any[];
                  const hl7 = products.length > 0
                    ? toHL7Prescription(cart, { questionnaireCode: QUESTIONNAIRE_CODES.PHARMACY_ORDER })
                    : '';
                  window.open(
                    buildWhatsAppUrl(hl7, WEBSITE_PRESCRIPTION_PHONE, QUESTIONNAIRE_CODES.PHARMACY_ORDER),
                    '_blank',
                  );
                }}
              >
                Contact Pharmacist
              </Button>
              <Button
                radius="xl"
                variant="filled"
                color="blue"
                leftSection={<MessageSquare size={18} />}
                onClick={() => {
                  const cart = useCartStore.getState().items;
                  const hl7 = cart.length > 0
                    ? toHL7Prescription(cart, { questionnaireCode: QUESTIONNAIRE_CODES.PHARMACY_ORDER })
                    : '';
                  useChatbotStore.getState().openWith(hl7, QUESTIONNAIRE_CODES.PHARMACY_ORDER);
                }}
              >
                Chat
              </Button>
            </Group>

            <Alert icon={<Stethoscope size={16} />} color="blue" variant="light" radius="lg">
              Our pharmacists will review your prescription and may contact you for clarification.
            </Alert>
          </>
        )}
      </Stack>
    </Paper>
  );
}

function StepPayment({
  providers,
  paymentMethod,
  setPaymentMethod,
  promoCode,
  setPromoCode,
  items,
  subtotal,
  deliveryFee,
  total,
  totalItems,
}: {
  providers: Array<{ id: string; name: string; providerType: string; production: boolean }>;
  paymentMethod: string | null;
  setPaymentMethod: (v: string | null) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  items: { productId: string; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalItems: number;
}) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
          <Stack gap="md">
            <Group gap={6}>
              <CreditCard size={20} color={green} />
              <Text fw={900} size="lg">
                Payment Method
              </Text>
            </Group>
            <Divider />

            <Radio.Group value={paymentMethod} onChange={setPaymentMethod}>
              <Stack gap="xs">
                {providers.length === 0 && (
                  <Text size="sm" c={muted}>
                    No online payment providers are enabled yet.
                  </Text>
                )}
                {providers.map((p) => (
                  <Paper
                    key={p.id}
                    radius={16}
                    withBorder
                    p="sm"
                    style={{
                      borderColor: paymentMethod === p.id ? green : line,
                      background: paymentMethod === p.id ? soft : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPaymentMethod(p.id)}
                  >
                    <Radio
                      value={p.id}
                      label={`${p.name} (${p.production ? 'Live' : 'Test'})`}
                    />
                  </Paper>
                ))}
              </Stack>
            </Radio.Group>

            <Divider />

            <Text fw={800} size="sm">
              Promo Code
            </Text>
            <Input
              placeholder="Enter promo code"
              radius="xl"
              value={promoCode}
              onChange={(e) => setPromoCode(e.currentTarget.value)}
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
          </Stack>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper radius={24} p="xl" withBorder style={{ borderColor: line, background: soft }}>
          <Stack gap="md">
            <Text fw={900} size="lg">
              Order Summary
            </Text>
            <Divider />

            {items.map((item) => (
              <Group key={item.productId} justify="space-between">
                <Text size="sm" c={muted}>
                  {getProductName(item.productId)} x{item.quantity}
                </Text>
                <Text fw={700} size="sm">
                  {formatPrice(getMockPrice2(item.productId) * item.quantity)}
                </Text>
              </Group>
            ))}

            <Divider />
            <Group justify="space-between">
              <Text c={muted}>Subtotal</Text>
              <Text fw={800}>{formatPrice(subtotal)}</Text>
            </Group>
            <Group justify="space-between">
              <Text c={muted}>Delivery Fee</Text>
              <Text fw={800}>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text fw={900} size="lg">
                Total
              </Text>
              <Text fw={950} size="lg" c={darkGreen}>
                {formatPrice(total)}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}
