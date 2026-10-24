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
  Loader,
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
  MessageSquare,
  Navigation,
  Package,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Store,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useWebPaymentProviders, useInitializeWebPayment } from '../api/posApi';
import { getNearbyPharmacies, type NearbyPharmacyRecord } from '../locator/api';
import { publicBaseUrl } from '../public-base-url';
import { useAccountDrawerStore } from '../website/account-drawer-store';
import { websiteApi } from '../website/api';
import { useAuthStore } from '../website/auth-store';
import { useCartStore } from '../website/cart-store';
import { useChatbotStore } from '../website/chatbot-store';
import { toHL7Prescription, QUESTIONNAIRE_CODES } from '../website/hl7-prescription';
import {
  useBranches,
  useCartProductHydration,
  useCreateOrder,
  useDeliveryAreas,
} from '../website/hooks';
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
import type { DeliveryAreaView, OrderView, WebsiteProduct } from '../website/types';
type DeliveryMode = 'dispatch' | 'contact' | 'pickup';

/**
 * A pickup choice: either an internal branch (`isBranch`) or a pharmacy from
 * the national registry returned by /v1/pharmacies/nearby.
 */
interface PickupOption {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  isBranch: boolean;
}

/** Address line without repeating city/state already present in the street. */
function pickupAddressLine(option: PickupOption): string {
  const parts = [option.address];
  const joined = () => parts.join(' ').toLowerCase();
  if (option.city && !joined().includes(option.city.toLowerCase())) parts.push(option.city);
  if (option.state && !joined().includes(option.state.toLowerCase())) parts.push(option.state);
  return parts.filter(Boolean).join(', ');
}

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

// Helpers read from the item's own product data (stored by the cart store at
// add time, or hydrated from /website/cart for legacy persisted carts). The
// old mock productInfo/productPrices maps keyed '1'-'10' never matched real
// product ids, which is why checkout showed "Medication" with fake prices.
function itemLabel(i: {
  productId?: string;
  name?: string;
  product?: WebsiteProduct | null;
}): string {
  return (
    i.name ||
    i.product?.name ||
    (i.productId ? productInfo[i.productId]?.name : undefined) ||
    'Medication'
  );
}

function itemUnitPrice(i: {
  productId?: string;
  unitPrice?: number;
  product?: WebsiteProduct | null;
}): number {
  const p =
    i.unitPrice ??
    (i.product as any)?.unitPrice ??
    (i.productId ? productPrices[i.productId] : undefined) ??
    0;
  return Number(p) || 0;
}

function itemGenericName(i: { productId?: string; product?: WebsiteProduct | null }): string {
  return (
    i.product?.genericProduct?.pharmaceutics?.commonGenericName ||
    i.product?.genericProduct?.name ||
    (i.productId ? productInfo[i.productId]?.genericName : undefined) ||
    'Generic Medicine'
  );
}

function itemIsRx(i: { productId?: string; product?: WebsiteProduct | null }): boolean {
  return (
    i.product?.isPrescriptionRequired ??
    (i.productId ? productInfo[i.productId]?.isRx : undefined) ??
    false
  );
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
  const { isAuthenticated, user } = useAuthStore();
  const { mutate: placeOrder, isPending } = useCreateOrder();
  const { data: deliveryAreasData, isLoading: areasLoading } = useDeliveryAreas();
  const { data: allBranches = [], isLoading: branchesLoading } = useBranches();
  const { data: providers = [] } = useWebPaymentProviders('web');
  const initialize = useInitializeWebPayment();
  const navigate = useNavigate();

  const deliveryAreas =
    deliveryAreasData && deliveryAreasData.length > 0 ? deliveryAreasData : mockDeliveryAreas;

  // Signed-out shoppers get the auth drawer popped automatically (Sign In
  // tab) — no need to click Sign In / Register first.
  useEffect(() => {
    if (!isAuthenticated) {
      openAccountDrawer('signin');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Signed-in shoppers: prefill the contact details we already hold.
  useEffect(() => {
    if (!user) return;
    setPhone((prev) => prev || user.phone || '');
    // Phone-only accounts can carry their user id in `email`; never prefill it.
    const accountEmail = user.email?.includes('@') ? user.email : '';
    setEmail((prev) => prev || accountEmail);
  }, [user]);

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state_, setState_] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // Delivery Options: dispatch (address), just call me (phone only), or pickup
  // at a nearby pharmacy.
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('dispatch');
  const [pickupBranchId, setPickupBranchId] = useState<string | null>(null);
  const [nearbyPickup, setNearbyPickup] = useState<NearbyPharmacyRecord[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [deliveryAreaId, setDeliveryAreaId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(providers[0]?.id ?? null);

  // Default to the first available provider once the list resolves.
  useEffect(() => {
    if (!paymentMethod && providers.length > 0) {
      setPaymentMethod(providers[0].id);
    }
  }, [providers, paymentMethod]);
  const [promoCode, setPromoCode] = useState('');
  // Coupon state: validated against POST /coupons/validate before apply, and
  // passed to the order for server-side redemption + discount.
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    type?: 'percent' | 'fixed';
  } | null>(null);
  const [couponStatus, setCouponStatus] = useState<{
    kind: 'idle' | 'error' | 'success';
    message: string;
  }>({ kind: 'idle', message: '' });
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderView | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const openAccountDrawer = useAccountDrawerStore((s) => s.open);

  // Returning customer: entering a known phone fills the delivery details.
  const autofillFromPhone = async () => {
    const digits = phone.replace(/\D/g, '');
    if (deliveryMode !== 'dispatch' || digits.length < 7) return;
    try {
      const found = await websiteApi.lookupCheckoutCustomer(phone);
      if (!found) return;
      if (!address && found.address) setAddress(found.address);
      if (!email && found.email) setEmail(found.email);
    } catch {
      /* best-effort autofill */
    }
  };

  const selectedArea = deliveryAreas.find((a) => a.id === deliveryAreaId);

  // Pickup: nearby pharmacies from the national register (returned by
  // "Use my location") come first, then matching internal branches. The
  // branches table can legitimately be empty, so the registry results are the
  // primary source rather than a fallback.
  const pickupBranches = useMemo((): PickupOption[] => {
    const cityFilter = (city || selectedArea?.city || '').trim().toLowerCase();
    const stateFilter = (state_ || selectedArea?.state || '').trim().toLowerCase();

    const registry = nearbyPickup.map((pharmacy) => ({
      id: `pharmacy:${pharmacy.id}`,
      name: pharmacy.premisesName?.trim() || 'Pharmacy',
      address: pharmacy.premisesAddress?.trim() || '',
      city: pharmacy.areaName ?? pharmacy.lgaName ?? null,
      state: pharmacy.stateName ?? null,
      phone: null,
      isBranch: false,
    }));

    const matchingBranches = allBranches.filter((branch) => {
      const branchCity = (branch.city ?? '').toLowerCase();
      const branchState = (branch.state ?? '').toLowerCase();
      const branchAddress = (branch.address ?? '').toLowerCase();
      const cityOk =
        !cityFilter || branchCity.includes(cityFilter) || branchAddress.includes(cityFilter);
      const stateOk = !stateFilter || branchState.includes(stateFilter);
      return cityOk && stateOk;
    });
    // With registry results present, only add branches that match the area;
    // otherwise keep the old "all branches" fallback.
    const branchRows = (
      matchingBranches.length > 0 || nearbyPickup.length === 0 ? matchingBranches : []
    ).map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      phone: branch.phone,
      isBranch: true,
    }));

    const seen = new Set<string>();
    const options: PickupOption[] = [];
    for (const option of [...registry, ...branchRows]) {
      const key = `${option.name}|${option.address}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push(option);
    }
    return options;
  }, [allBranches, city, state_, selectedArea, nearbyPickup]);

  // "Use my current location": geolocate, then use the nearest premises in the
  // register to infer the area and filter the pharmacy list.
  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationNote('Location is not available in this browser — enter your city/state.');
      return;
    }
    setLocating(true);
    setLocationNote(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const nearby = await getNearbyPharmacies(
            position.coords.latitude,
            position.coords.longitude,
            25,
            5
          );
          setNearbyPickup(nearby);
          const nearest = nearby[0];
          if (nearest?.stateName) {
            setState_(nearest.stateName);
            if (nearest.areaName) {
              setCity(nearest.areaName);
            }
            setLocationNote(
              `Nearest area: ${nearest.areaName ?? nearest.lgaName ?? nearest.stateName}.`
            );
          } else {
            setLocationNote('Could not match your location to an area — enter your city/state.');
          }
        } catch {
          setLocationNote('Could not look up nearby pharmacies — enter your city/state.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocationNote('Location permission denied — enter your city/state.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Guards the auto-initiate flow so selecting a provider twice can't create
  // two orders.
  const placingRef = useRef(false);

  useCartProductHydration();

  const subtotal = items.reduce((sum, i) => sum + itemUnitPrice(i) * i.quantity, 0);
  const deliveryFee =
    deliveryMode === 'dispatch'
      ? selectedArea
        ? subtotal >= (selectedArea.freeDeliveryAbove || Infinity)
          ? 0
          : selectedArea.deliveryFee
        : subtotal >= 10000
          ? 0
          : 1500
      : 0;
  const total = Math.max(subtotal + deliveryFee - (appliedCoupon?.discountAmount ?? 0), 0);
  const rxItems = items.filter(itemIsRx);

  const handleApplyCoupon = async () => {
    const code = promoCode.trim();
    if (!code) {
      setAppliedCoupon(null);
      setCouponStatus({ kind: 'idle', message: '' });
      return;
    }
    setCheckingCoupon(true);
    try {
      const result = await websiteApi.validateCoupon(code, subtotal);
      if (result.valid) {
        setAppliedCoupon({
          code: result.code,
          discountAmount: result.discountAmount,
          type: result.type,
        });
        setCouponStatus({
          kind: 'success',
          message: `Coupon ${result.code} applied — you save ${formatPrice(result.discountAmount)}.`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponStatus({ kind: 'error', message: result.reason ?? 'Invalid coupon code.' });
      }
    } catch {
      setAppliedCoupon(null);
      setCouponStatus({ kind: 'error', message: 'Could not validate the coupon. Try again.' });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const canGoNext = () => {
    switch (step) {
      case 0:
        return items.length > 0;
      case 1:
        if (!phone) return false;
        if (deliveryMode === 'contact') return true;
        if (deliveryMode === 'pickup') return !!pickupBranchId;
        return !!address && !!city && !!state_ && !!deliveryAreaId;
      case 2:
        return true;
      case 3:
        return !!paymentMethod;
      default:
        return true;
    }
  };

  const handlePlaceOrder = (overrideProviderId?: string) => {
    const providerId = overrideProviderId ?? paymentMethod;
    if (!providerId || placingRef.current) {
      return;
    }
    placingRef.current = true;
    setOrderError(null);
    const selectedPickup =
      deliveryMode === 'pickup'
        ? (pickupBranches.find((option) => option.id === pickupBranchId) ?? null)
        : null;
    const registryPickup = selectedPickup && !selectedPickup.isBranch ? selectedPickup : null;
    placeOrder(
      {
        paymentMethod: providers.find((p) => p.id === providerId)?.name || 'Card',
        notes: promoCode ? `Promo: ${promoCode}` : undefined,
        couponCode: appliedCoupon?.code,
        items: items.map((i) => {
          // Every line carries all available descriptive fields so the order is
          // readable before reconciliation: the item name as freetextName, plus
          // the generic product/drug codes when the hydrated product knows them.
          const displayName = i.name ?? i.product?.name;
          // GP business code only — a concepts UUID is not resolvable
          // as a generic reference (legacy carts may still store it).
          const gpCode = i.genericProductCode;
          const genericProductCode =
            gpCode && gpCode.startsWith('GP-')
              ? gpCode
              : (i.product?.genericProduct?.code ?? undefined);
          const genericDrugCode = i.genericDrugCode ?? i.product?.genericDrugCode ?? undefined;
          if (i.productId) {
            return {
              itemId: i.productId,
              freetextName: displayName,
              genericProductCode,
              genericDrugCode,
              quantity: i.quantity,
              unitPrice: itemUnitPrice(i),
            };
          }
          if (i.genericDrugCode) {
            return {
              genericDrugCode: i.genericDrugCode,
              freetextName: displayName,
              quantity: i.quantity,
              unitPrice: i.unitPrice ?? 0,
            };
          }
          if (i.genericProductCode) {
            return {
              genericItemCode: i.genericProductCode,
              freetextName: displayName,
              quantity: i.quantity,
              unitPrice: i.unitPrice ?? 0,
            };
          }
          return { freetextName: displayName, quantity: i.quantity, unitPrice: i.unitPrice ?? 0 };
        }),
        delivery: {
          // Registry pharmacies have no branch row — record the chosen
          // collection point as the delivery address so fulfilment sees it.
          address:
            deliveryMode === 'dispatch'
              ? address
              : registryPickup
                ? [registryPickup.name, registryPickup.address].filter(Boolean).join(' — ')
                : undefined,
          city: deliveryMode === 'dispatch' ? city : (registryPickup?.city ?? undefined),
          state: deliveryMode === 'dispatch' ? state_ : (registryPickup?.state ?? undefined),
          phone: phone || undefined,
          email: email || undefined,
          contactOnly: deliveryMode === 'contact',
          pickupBranchId:
            deliveryMode === 'pickup' && selectedPickup?.isBranch ? selectedPickup.id : undefined,
          shippingMethod:
            deliveryMode === 'pickup'
              ? 'pickup'
              : deliveryMode === 'contact'
                ? 'contact-only'
                : 'standard',
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          setPlacedOrder(order);
          // Initialise the gateway payment. The backend marks the order
          // 'paying' as part of this call, BEFORE we navigate away.
          initialize.mutate(
            {
              amount: total,
              sourceType: 'order',
              sourceId: order.id,
              providerId,
              returnUrl: `${publicBaseUrl()}/shop/pay/return?order=${order.id}`,
            },
            {
              onSuccess: (res) => {
                placingRef.current = false;
                if (res.checkoutUrl) {
                  window.location.href = res.checkoutUrl;
                  return;
                }
                setPaymentUrl(null);
                setStep(4);
              },
              onError: (err) => {
                // Do not advance when the provider link cannot be generated.
                placingRef.current = false;
                setOrderError(getApiErrorMessage(err));
                setStep(3);
              },
            }
          );
        },
        onError: (error) => {
          placingRef.current = false;
          setOrderError(getApiErrorMessage(error));
        },
      }
    );
  };

  if (orderError) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={80}>
          <Alert icon={<AlertTriangle size={20} />} title="Order failed" color="red" radius="lg">
            {orderError}
          </Alert>
          <Group justify="center" mt="xl">
            <Button
              radius="xl"
              variant="light"
              color="green"
              onClick={() => {
                setOrderError(null);
                setStep(3);
              }}
            >
              Try again
            </Button>
            <Button radius="xl" variant="subtle" onClick={() => navigate({ to: '/shop/shop' })}>
              Continue Shopping
            </Button>
          </Group>
        </Container>
      </WebsiteLayout>
    );
  }

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
              {paymentUrl ? (
                <Button
                  radius="xl"
                  size="lg"
                  color="green"
                  styles={buttonStyles}
                  style={{ background: green }}
                  leftSection={<CreditCard size={18} />}
                  onClick={() => {
                    window.location.href = paymentUrl;
                  }}
                >
                  Pay Now
                </Button>
              ) : null}
              <Button
                radius="xl"
                color="green"
                styles={buttonStyles}
                style={{ background: green }}
                leftSection={<Package size={18} />}
                onClick={() => navigate({ to: '/shop/orders' })}
              >
                Track Order
              </Button>
              <Button
                radius="xl"
                variant="light"
                color="green"
                leftSection={<ShoppingBag size={18} />}
                onClick={() => navigate({ to: '/shop/shop' })}
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
            <Stepper.Step label="Delivery" description="Delivery or pickup" />
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
                Register to continue
              </Text>
              <Text c={muted} size="sm" mt={4}>
                Create an account to complete your order. A token is issued so you can continue
                checking out.
              </Text>
              <Group justify="center" mt="lg" gap="sm">
                <Button
                  radius="xl"
                  color="green"
                  styles={buttonStyles}
                  style={{ background: green }}
                  onClick={() => openAccountDrawer('register')}
                >
                  Register
                </Button>
                <Button
                  radius="xl"
                  variant="light"
                  color="green"
                  styles={buttonStyles}
                  onClick={() => openAccountDrawer('signin')}
                >
                  Sign In
                </Button>
              </Group>
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
                  onPhoneBlur={() => void autofillFromPhone()}
                  email={email}
                  setEmail={setEmail}
                  deliveryMode={deliveryMode}
                  setDeliveryMode={setDeliveryMode}
                  pickupBranchId={pickupBranchId}
                  setPickupBranchId={setPickupBranchId}
                  branches={pickupBranches}
                  branchesLoading={branchesLoading}
                  onUseLocation={useMyLocation}
                  locating={locating}
                  locationNote={locationNote}
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
                  setPaymentMethod={(value) => {
                    setPaymentMethod(value);
                    // Selecting a provider immediately creates the order and
                    // sends the shopper to the gateway.
                    if (value) handlePlaceOrder(value);
                  }}
                  promoCode={promoCode}
                  setPromoCode={setPromoCode}
                  items={items}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  total={total}
                  totalItems={totalItems}
                  appliedCoupon={appliedCoupon}
                  checkingCoupon={checkingCoupon}
                  couponStatus={couponStatus}
                  onApplyCoupon={() => void handleApplyCoupon()}
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
                  if (step === 0) {
                    navigate({ to: '/shop/cart' });
                  } else {
                    setStep(step - 1);
                  }
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
                  onClick={() => handlePlaceOrder()}
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
  items: { productId?: string; name?: string; unitPrice?: number; quantity: number }[];
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
          const rx = itemIsRx(item);
          const price = itemUnitPrice(item);
          return (
            <Group key={item.productId ?? item.name} justify="space-between" wrap="nowrap">
              <Group gap="md" wrap="nowrap">
                <Image
                  src="https://placehold.co/56x56/16A34A/white?text=Rx"
                  alt={itemLabel(item)}
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
                      {itemLabel(item)}
                    </Text>
                    {rx ? (
                      <Badge color="orange" variant="light" size="xs" radius="xl">
                        <Pill size={8} /> Rx
                      </Badge>
                    ) : null}
                  </Group>
                  <Text size="xs" c={muted}>
                    {itemGenericName(item)}
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
  onPhoneBlur,
  email,
  setEmail,
  deliveryMode,
  setDeliveryMode,
  pickupBranchId,
  setPickupBranchId,
  branches,
  branchesLoading,
  onUseLocation,
  locating,
  locationNote,
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
  onPhoneBlur?: () => void;
  email: string;
  setEmail: (v: string) => void;
  deliveryMode: DeliveryMode;
  setDeliveryMode: (v: DeliveryMode) => void;
  pickupBranchId: string | null;
  setPickupBranchId: (v: string | null) => void;
  branches: PickupOption[];
  branchesLoading: boolean;
  onUseLocation: () => void;
  locating: boolean;
  locationNote: string | null;
  deliveryAreaId: string | null;
  setDeliveryAreaId: (v: string | null) => void;
  deliveryAreas: DeliveryAreaView[];
  areasLoading: boolean;
  selectedArea: DeliveryAreaView | undefined;
  items: { productId?: string; name?: string; unitPrice?: number; quantity: number }[];
}) {
  const options: Array<{
    value: DeliveryMode;
    title: string;
    description: string;
    Icon: typeof Truck;
  }> = [
    {
      value: 'dispatch',
      title: 'Dispatch Delivery',
      description: 'Delivered to your address',
      Icon: Truck,
    },
    {
      value: 'contact',
      title: 'Just Call Me',
      description: "We'll reach you by phone/email — no delivery address needed",
      Icon: MessageSquare,
    },
    {
      value: 'pickup',
      title: 'Pickup at nearest Pharmacy',
      description: 'Collect from a pharmacy near you',
      Icon: Store,
    },
  ];

  return (
    <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
      <Stack gap="md">
        <Group gap={6}>
          <MapPin size={20} color={green} />
          <Text fw={900} size="lg">
            Delivery Options
          </Text>
        </Group>
        <Divider />

        <Radio.Group
          value={deliveryMode}
          onChange={(value) => value && setDeliveryMode(value as DeliveryMode)}
        >
          <Stack gap="xs">
            {options.map((option) => {
              const selected = deliveryMode === option.value;
              const Icon = option.Icon;
              return (
                <Paper
                  key={option.value}
                  radius={16}
                  withBorder
                  p="sm"
                  style={{
                    borderColor: selected ? green : line,
                    background: selected ? soft : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                  onClick={() => setDeliveryMode(option.value)}
                  data-testid={`delivery-mode-${option.value}`}
                >
                  <Group gap="sm" wrap="nowrap">
                    <Radio
                      value={option.value}
                      data-testid={`delivery-mode-radio-${option.value}`}
                    />
                    <ThemeIcon radius="xl" color="green" variant="light" size="md">
                      <Icon size={16} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={800} size="sm">
                        {option.title}
                      </Text>
                      <Text size="xs" c={muted}>
                        {option.description}
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </Radio.Group>

        <TextInput
          label="Phone Number"
          placeholder="+234 800 000 0000"
          radius="xl"
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          onBlur={onPhoneBlur}
          required
          styles={{ input: { borderColor: line } }}
        />

        <TextInput
          label="Email"
          placeholder="you@example.com"
          type="email"
          radius="xl"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          styles={{ input: { borderColor: line } }}
        />

        {deliveryMode === 'dispatch' && (
          <>
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
          </>
        )}

        {deliveryMode === 'contact' && (
          <Alert color="blue" variant="light" radius="lg" icon={<MessageSquare size={16} />}>
            We&apos;ll reach you on the phone or email above — no delivery address needed.
          </Alert>
        )}

        {deliveryMode === 'pickup' && (
          <>
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Text size="sm" c={muted}>
                Choose the pharmacy you&apos;d like to collect from.
              </Text>
              <Button
                variant="light"
                radius="xl"
                color="green"
                leftSection={<Navigation size={16} />}
                loading={locating}
                onClick={onUseLocation}
                data-testid="pickup-use-location"
              >
                Use my location
              </Button>
            </Group>

            {locationNote ? (
              <Text size="xs" c={muted}>
                {locationNote}
              </Text>
            ) : null}

            {branchesLoading ? (
              <Group justify="center" py="md">
                <Loader size="sm" />
              </Group>
            ) : branches.length === 0 ? (
              <Alert icon={<AlertTriangle size={16} />} color="orange" variant="light" radius="lg">
                {locationNote
                  ? 'No pharmacies are available for pickup right now.'
                  : 'Tap "Use my location" to find pharmacies near you.'}
              </Alert>
            ) : (
              <Radio.Group value={pickupBranchId} onChange={setPickupBranchId}>
                <Stack gap="xs">
                  {branches.map((branch) => {
                    const selected = pickupBranchId === branch.id;
                    return (
                      <Paper
                        key={branch.id}
                        radius={16}
                        withBorder
                        p="sm"
                        style={{
                          borderColor: selected ? green : line,
                          background: selected ? soft : '#FFFFFF',
                          cursor: 'pointer',
                        }}
                        onClick={() => setPickupBranchId(branch.id)}
                        data-testid={`pickup-branch-${branch.id}`}
                      >
                        <Group gap="sm" wrap="nowrap" align="flex-start">
                          <Radio
                            value={branch.id}
                            data-testid={`pickup-branch-radio-${branch.id}`}
                          />
                          <Box>
                            <Text fw={800} size="sm">
                              {branch.name}
                            </Text>
                            <Text size="xs" c={muted}>
                              {pickupAddressLine(branch)}
                            </Text>
                            {branch.phone ? (
                              <Text size="xs" c={muted}>
                                {branch.phone}
                              </Text>
                            ) : null}
                          </Box>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              </Radio.Group>
            )}

            <Alert color="green" variant="light" radius="lg" icon={<Store size={16} />}>
              Pickup is free — you&apos;ll collect from the selected pharmacy when your order is
              ready.
            </Alert>
          </>
        )}
      </Stack>
    </Paper>
  );
}

function subtotalValue(
  items: { productId?: string; unitPrice?: number; quantity: number }[]
): number {
  return items.reduce((sum, i) => sum + itemUnitPrice(i) * i.quantity, 0);
}

function StepPrescriptionValidation({
  rxItems,
}: {
  rxItems: { productId?: string; name?: string; unitPrice?: number; quantity: number }[];
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
              <Group key={item.productId ?? item.name} justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon radius="xl" color="orange" variant="light" size="md">
                    <Pill size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={800} size="sm">
                      {itemLabel(item)}
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
                onClick={() => navigate({ to: '/shop/upload-prescription' })}
              >
                Upload Prescription
              </Button>
              {/* Order via chat: opens the pharmacist-technician bot in the
                  on-site chatbot with the order payload. */}
              <Button
                radius="xl"
                variant="filled"
                color="blue"
                leftSection={<MessageSquare size={18} />}
                onClick={() => {
                  const cart = useCartStore.getState().items;
                  const hl7 =
                    cart.length > 0
                      ? toHL7Prescription(cart, {
                          questionnaireCode: QUESTIONNAIRE_CODES.PHARMACIST_TECHNICIAN,
                        })
                      : '';
                  useChatbotStore
                    .getState()
                    .openWith(hl7, QUESTIONNAIRE_CODES.PHARMACIST_TECHNICIAN);
                }}
              >
                Order via Chat
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
  totalItems: _totalItems,
  appliedCoupon,
  checkingCoupon,
  couponStatus,
  onApplyCoupon,
}: {
  providers: Array<{ id: string; name: string; providerType: string; production: boolean }>;
  paymentMethod: string | null;
  setPaymentMethod: (v: string | null) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  items: { productId?: string; name?: string; unitPrice?: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalItems: number;
  appliedCoupon: { code: string; discountAmount: number; type?: 'percent' | 'fixed' } | null;
  checkingCoupon: boolean;
  couponStatus: { kind: 'idle' | 'error' | 'success'; message: string };
  onApplyCoupon: () => void;
}) {
  return (
    <Grid>
      {/* Items/order summary on the LEFT — payment picks up on the right, */}
      {/* matching the left-to-right flow of every other checkout step. */}
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
          <Stack gap="md">
            <Group gap={6}>
              <ShoppingCart size={20} color={green} />
              <Text fw={900} size="lg">
                Order Summary
              </Text>
            </Group>
            <Divider />

            {items.map((item) => (
              <Group key={item.productId ?? item.name} justify="space-between">
                <Text size="sm" c={muted}>
                  {itemLabel(item)} x{item.quantity}
                </Text>
                <Text fw={700} size="sm">
                  {formatPrice(itemUnitPrice(item) * item.quantity)}
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
            {appliedCoupon && (
              <>
                <Group justify="space-between">
                  <Text c={green}>Coupon ({appliedCoupon.code})</Text>
                  <Text fw={800} c={green}>
                    −{formatPrice(appliedCoupon.discountAmount)}
                  </Text>
                </Group>
                <Divider />
              </>
            )}
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

      {/* Payment method + promo on the RIGHT. */}
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper radius={24} p="xl" withBorder style={{ borderColor: line, background: soft }}>
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
                      background: paymentMethod === p.id ? '#FFFFFF' : soft,
                      cursor: 'pointer',
                    }}
                    onClick={() => setPaymentMethod(p.id)}
                  >
                    <Radio value={p.id} label={`${p.name} (${p.production ? 'Live' : 'Test'})`} />
                  </Paper>
                ))}
              </Stack>
            </Radio.Group>

            <Divider />

            <Text fw={800} size="sm">
              Promo Code
            </Text>
            <Input
              placeholder="Enter promo code (e.g. WELCOME20)"
              radius="xl"
              value={promoCode}
              onChange={(e) => setPromoCode(e.currentTarget.value)}
              styles={{ input: { borderColor: line, background: '#FFFFFF' } }}
              rightSection={
                <Button
                  size="xs"
                  radius="xl"
                  color="green"
                  variant="light"
                  loading={checkingCoupon}
                  style={{ marginRight: 4 }}
                  onClick={onApplyCoupon}
                >
                  Apply
                </Button>
              }
            />
            {couponStatus.kind !== 'idle' && (
              <Text size="xs" c={couponStatus.kind === 'error' ? 'red' : green}>
                {couponStatus.message}
              </Text>
            )}
            {appliedCoupon && (
              <Group justify="space-between">
                <Text size="sm" c={green} fw={700}>
                  Coupon {appliedCoupon.code}
                </Text>
                <Text size="sm" c={green} fw={800}>
                  −{formatPrice(appliedCoupon.discountAmount)}
                </Text>
              </Group>
            )}
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}
