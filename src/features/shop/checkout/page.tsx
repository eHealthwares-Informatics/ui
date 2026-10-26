import {
  Alert,
  Autocomplete,
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
  Radio,
  ScrollArea,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  FileUp,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Pill,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Store,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useWebPaymentProviders, useInitializeWebPayment } from '../api/posApi';
import {
  getNearbyPharmacies,
  getStates,
  searchPharmacies,
  type ConceptsState,
  type NearbyPharmacyRecord,
  type PharmacyRecord,
} from '../locator/api';
import { publicBaseUrl } from '../public-base-url';
import { websiteApi } from '../website/api';
import { useAuthStore } from '../website/auth-store';
import { useCartStore } from '../website/cart-store';
import { findParticipantByPhone } from '../website/chatbot-service';
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
import { CheckoutPhoneLoginModal } from './CheckoutPhoneLoginModal';
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
  '4': {
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    dosage: '20mg Capsule',
    isRx: false,
  },
  '5': {
    name: 'Metformin 500mg',
    genericName: 'Metformin HCl',
    dosage: '500mg Tablet',
    isRx: true,
  },
  '6': {
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    dosage: '400mg Tablet',
    isRx: false,
  },
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
  '9': {
    name: 'Lisinopril 5mg',
    genericName: 'Lisinopril',
    dosage: '5mg Tablet',
    isRx: true,
  },
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

/** Synthetic pickup id for a pharmacy the shopper typed in by hand. */
const MANUAL_PICKUP_ID = 'manual-pickup';

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

const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Federal Capital Territory',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

export default function CheckoutPage() {
  const { items, totalItems, clearCart } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { mutate: placeOrder, isPending } = useCreateOrder();
  const { data: deliveryAreasData, isLoading: areasLoading } = useDeliveryAreas();
  const { data: allBranches = [], isLoading: branchesLoading } = useBranches();
  const { data: providers = [] } = useWebPaymentProviders('web');
  const initialize = useInitializeWebPayment();
  const navigate = useNavigate();

  const deliveryAreas =
    deliveryAreasData && deliveryAreasData.length > 0 ? deliveryAreasData : mockDeliveryAreas;

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
  // Pharmacy-register results searched by the area the shopper typed, used when
  // geolocation is not active so pickup options still populate.
  const [areaPharmacies, setAreaPharmacies] = useState<PharmacyRecord[]>([]);
  // Register states (name ↔ code) so pharmacy searches can be scoped to the
  // selected state.
  const [states, setStates] = useState<ConceptsState[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [deliveryAreaId, setDeliveryAreaId] = useState<string | null>(null);
  // Free-text fallbacks: the published area list and geolocation do not cover
  // every address, so the shopper can type their area or pharmacy instead of
  // being blocked at the delivery step.
  const [manualArea, setManualArea] = useState('');
  const [manualPharmacy, setManualPharmacy] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(providers[0]?.id ?? null);

  // Open the phone-login modal when a shopper enters a delivery phone but is
  // not yet authenticated, so the JWT exists before /payments/initialize.
  useEffect(() => {
    const digits = phone.replace(/\D/g, '');
    if (step === 1 && !isAuthenticated && digits.length >= 7) {
      setLoginModalOpened(true);
    }
  }, [step, phone, isAuthenticated]);

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
  const [loginModalOpened, setLoginModalOpened] = useState(false);

  // Prescriber details captured inline on the prescription step (replaces the
  // separate upload-prescription page).
  const [prescriberType, setPrescriberType] = useState<'Pharmacist' | 'Doctor' | 'Professional'>(
    'Doctor'
  );
  const [prescriberName, setPrescriberName] = useState('');
  const [prescriberLicense, setPrescriberLicense] = useState('');
  const [prescriberPhone, setPrescriberPhone] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  // Optional prescription image(s)/PDF attached on the prescription step.
  const [rxFiles, setRxFiles] = useState<File[]>([]);

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

  // On phone entry: confirm the stored session/token is still valid, then use
  // that token to resolve the shopper's conversation participant by phone.
  // An invalid/expired session is cleared and the shopper is asked to sign in.
  const checkSessionAndParticipant = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || !isAuthenticated) return;
    try {
      await websiteApi.getSession();
    } catch {
      // Token invalid and could not be refreshed — force a fresh sign-in.
      logout();
      setLoginModalOpened(true);
      return;
    }
    // Resolve (do not create) the participant using the validated token.
    await findParticipantByPhone(digits);
  };

  const selectedArea = deliveryAreas.find((a) => a.id === deliveryAreaId);
  const typedArea = !selectedArea ? manualArea.trim() : '';
  const typedPharmacy = manualPharmacy.trim();

  // Pickup: nearby pharmacies from the national register (returned by
  // "Use my location") come first, then matching internal branches. The
  // branches table can legitimately be empty, so the registry results are the
  // primary source rather than a fallback.
  const pickupBranches = useMemo((): PickupOption[] => {
    const cityFilter = (city || selectedArea?.city || '').trim().toLowerCase();
    const stateFilter = (state_ || selectedArea?.state || '').trim().toLowerCase();
    const nameFilter = typedPharmacy.toLowerCase();

    const stateOkFor = (stateName?: string | null, address?: string | null) => {
      if (!stateFilter) return true;
      return `${stateName ?? ''} ${address ?? ''}`.toLowerCase().includes(stateFilter);
    };
    const nameOkFor = (name?: string | null) =>
      !nameFilter || (name ?? '').toLowerCase().includes(nameFilter);

    const registry = nearbyPickup
      .filter((p) => stateOkFor(p.stateName, p.premisesAddress) && nameOkFor(p.premisesName))
      .map((pharmacy) => ({
        id: `pharmacy:${pharmacy.id}`,
        name: pharmacy.premisesName?.trim() || 'Pharmacy',
        address: pharmacy.premisesAddress?.trim() || '',
        city: pharmacy.areaName ?? pharmacy.lgaName ?? null,
        state: pharmacy.stateName ?? null,
        phone: null,
        isBranch: false,
      }));

    // Register results searched by the typed area / pharmacy name.
    const areaRegistry = areaPharmacies
      .filter((p) => stateOkFor(p.stateName, p.premisesAddress) && nameOkFor(p.premisesName))
      .map((pharmacy) => ({
        id: `pharmacy:${pharmacy.id}`,
        name: pharmacy.premisesName?.trim() || 'Pharmacy',
        address: pharmacy.premisesAddress?.trim() || '',
        city: pharmacy.area ?? pharmacy.lgaName ?? null,
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
      const nameOk = nameOkFor(branch.name);
      return cityOk && stateOk && nameOk;
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
    for (const option of [...registry, ...areaRegistry, ...branchRows]) {
      const key = `${option.name}|${option.address}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push(option);
    }
    // A pharmacy the shopper typed in themselves (e.g. when the register has
    // no nearby result because location is unavailable).
    if (typedPharmacy) {
      options.push({
        id: MANUAL_PICKUP_ID,
        name: typedPharmacy,
        address: [city, state_].filter(Boolean).join(', '),
        city: city || selectedArea?.city || null,
        state: state_ || selectedArea?.state || null,
        phone: null,
        isBranch: false,
      });
    }
    return options;
  }, [allBranches, city, state_, selectedArea, nearbyPickup, areaPharmacies, typedPharmacy]);

  // Load register states once so the typed state name can resolve to its code
  // and scope pharmacy searches.
  useEffect(() => {
    let cancelled = false;
    getStates()
      .then((list) => {
        if (!cancelled) setStates(list);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedStateCode = useMemo(() => {
    const name = (state_ || selectedArea?.state || '').trim().toLowerCase();
    if (!name) return null;
    return states.find((s) => s.name.trim().toLowerCase() === name)?.code ?? null;
  }, [state_, selectedArea, states]);

  // When geolocation has not been used, search the pharmacy register by the
  // area the shopper typed (city/state or the chosen delivery area) so pickup
  // options populate without a location prompt.
  useEffect(() => {
    if (deliveryMode !== 'pickup') {
      setAreaPharmacies([]);
      return;
    }
    // A manually typed pharmacy name overrides the area search (fuzzy name
    // match on the register) so the list narrows to that pharmacy.
    const nameTerm = manualPharmacy.trim();
    const byName = nameTerm.length >= 2;
    if (!byName && nearbyPickup.length > 0) {
      setAreaPharmacies([]);
      return;
    }
    const cityTerm = (city || selectedArea?.city || '').trim();
    const stateTerm = (state_ || selectedArea?.state || '').trim();
    const term = byName ? nameTerm : cityTerm || stateTerm;
    if (term.length < 2) {
      setAreaPharmacies([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await searchPharmacies({
          search: term,
          state: selectedStateCode ?? undefined,
          limit: 50,
        });
        if (!cancelled) {
          setAreaPharmacies(res.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setAreaPharmacies([]);
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    deliveryMode,
    nearbyPickup.length,
    city,
    state_,
    selectedArea,
    manualPharmacy,
    selectedStateCode,
  ]);

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
        setCouponStatus({
          kind: 'error',
          message: result.reason ?? 'Invalid coupon code.',
        });
      }
    } catch {
      setAppliedCoupon(null);
      setCouponStatus({
        kind: 'error',
        message: 'Could not validate the coupon. Try again.',
      });
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
        if (deliveryMode === 'pickup') return !!pickupBranchId || !!typedPharmacy;
        return !!address && !!city && !!state_ && (!!deliveryAreaId || !!typedArea);
      case 2:
        // Prescription-required items need the prescriber's details.
        return rxItems.length === 0 || prescriberName.trim().length > 0;
      case 3:
        return !!paymentMethod;
      default:
        return true;
    }
  };

  // Advance to the next step, requiring sign-in on delivery so the JWT exists
  // before /payments/initialize. Shared by the top and bottom action buttons.
  const advance = () => {
    if (step === 1 && !isAuthenticated) {
      setLoginModalOpened(true);
      return;
    }
    setStep(step + 1);
  };

  const handlePlaceOrder = async (overrideProviderId?: string) => {
    const providerId = overrideProviderId ?? paymentMethod;
    if (!providerId || placingRef.current) {
      return;
    }
    // /payments/initialize needs a bearer token: never create an order/payment
    // for a shopper session that has no JWT.
    if (!isAuthenticated) {
      setLoginModalOpened(true);
      return;
    }
    placingRef.current = true;
    setOrderError(null);

    // Prescription-required items: persist the prescriber details (and any
    // attached files) as a prescription, then attach it to the order.
    let prescriptionIds: string[] | undefined;
    if (rxItems.length > 0) {
      try {
        const formData = new FormData();
        rxFiles.forEach((file) => formData.append('files', file));
        const details = [
          prescriberName.trim() ? `Prescriber: ${prescriberName.trim()} (${prescriberType})` : '',
          prescriberLicense.trim() ? `License: ${prescriberLicense.trim()}` : '',
          prescriberPhone.trim() ? `Prescriber phone: ${prescriberPhone.trim()}` : '',
          prescriptionNotes.trim() ? `Notes: ${prescriptionNotes.trim()}` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        if (details) {
          formData.append('notes', details);
        }
        if (phone) {
          formData.append('phone', phone);
        }
        if (email) {
          formData.append('email', email);
        }
        const saved = await websiteApi.createPrescription(formData);
        if (saved?.id) {
          prescriptionIds = [saved.id];
        }
      } catch (err) {
        placingRef.current = false;
        setOrderError(getApiErrorMessage(err));
        return;
      }
    }

    const selectedPickup =
      deliveryMode === 'pickup'
        ? (pickupBranches.find((option) => option.id === pickupBranchId) ?? null)
        : null;
    const registryPickup = selectedPickup && !selectedPickup.isBranch ? selectedPickup : null;
    placeOrder(
      {
        paymentMethod: providers.find((p) => p.id === providerId)?.name || 'Card',
        // The typed area/pharmacy is not in the published list, so record it
        // with the order for fulfilment to confirm.
        notes:
          [
            promoCode ? `Promo: ${promoCode}` : null,
            typedArea ? `Delivery area: ${typedArea}` : null,
            deliveryMode === 'pickup' && pickupBranchId === MANUAL_PICKUP_ID && typedPharmacy
              ? `Pickup at: ${typedPharmacy}`
              : null,
            // Prescriber details captured on the prescription step.
            rxItems.length > 0 && prescriberName.trim()
              ? `Prescriber: ${prescriberName.trim()} (${prescriberType})` +
                (prescriberLicense.trim() ? ` · License: ${prescriberLicense.trim()}` : '') +
                (prescriberPhone.trim() ? ` · ${prescriberPhone.trim()}` : '')
              : null,
            rxItems.length > 0 && prescriptionNotes.trim()
              ? `Rx notes: ${prescriptionNotes.trim()}`
              : null,
          ]
            .filter(Boolean)
            .join(' \u00b7 ') || undefined,
        couponCode: appliedCoupon?.code,
        prescriptionIds,
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
          return {
            freetextName: displayName,
            quantity: i.quantity,
            unitPrice: i.unitPrice ?? 0,
          };
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
              style={{
                borderColor: line,
                background: soft,
                display: 'inline-block',
              }}
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
      <style>{`
        @media (min-width: 62em) {
          .checkout-summary-sticky {
            position: sticky;
            top: 84px;
          }
        }
      `}</style>
      <Container size="xl" py={{ base: 14, md: 24 }}>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
            <Group gap={8} align="baseline" wrap="nowrap">
              <Text fw={900} className="damorex-heading" style={{ color: ink, fontSize: 14 }}>
                Checkout
              </Text>
              <Text size="xs" c={muted}>
                {totalItems} item{totalItems !== 1 ? 's' : ''} &middot; Secure checkout
              </Text>
            </Group>
          </Group>

          {/* Compact progress tracker — all five checkout steps stay visible */}
          <Paper radius="lg" p="xs" withBorder style={{ borderColor: line, background: soft }}>
            <Stepper
              active={step}
              onStepClick={setStep}
              color="green"
              radius="lg"
              size="xs"
              allowNextStepsSelect={false}
            >
              <Stepper.Step label="Cart" />
              <Stepper.Step label="Delivery" />
              <Stepper.Step label="Prescription" />
              <Stepper.Step label="Payment" />
              <Stepper.Step label="Done" />
            </Stepper>
          </Paper>

          <Grid>
            {/* Left column — the active step's form */}
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="lg">
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
                    manualArea={manualArea}
                    setManualArea={setManualArea}
                    manualPharmacy={manualPharmacy}
                    setManualPharmacy={setManualPharmacy}
                  />
                )}

                {step === 2 && (
                  <StepPrescriptionValidation
                    rxItems={rxItems}
                    prescriberType={prescriberType}
                    setPrescriberType={setPrescriberType}
                    prescriberName={prescriberName}
                    setPrescriberName={setPrescriberName}
                    prescriberLicense={prescriberLicense}
                    setPrescriberLicense={setPrescriberLicense}
                    prescriberPhone={prescriberPhone}
                    setPrescriberPhone={setPrescriberPhone}
                    prescriptionNotes={prescriptionNotes}
                    setPrescriptionNotes={setPrescriptionNotes}
                    rxFiles={rxFiles}
                    setRxFiles={setRxFiles}
                  />
                )}

                {step === 3 && (
                  <StepPayment
                    providers={providers}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={(value) => {
                      setPaymentMethod(value);
                      // Selecting a provider immediately creates the order and
                      // sends the shopper to the gateway.
                      if (value) void handlePlaceOrder(value);
                    }}
                    promoCode={promoCode}
                    setPromoCode={setPromoCode}
                    appliedCoupon={appliedCoupon}
                    checkingCoupon={checkingCoupon}
                    couponStatus={couponStatus}
                    onApplyCoupon={() => void handleApplyCoupon()}
                  />
                )}
              </Stack>
            </Grid.Col>

            {/* Right column — persistent, sticky order summary + trust indicators */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box className="checkout-summary-sticky" mt={{ base: 'lg', md: 0 }}>
                <OrderSummary
                  items={items}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  total={total}
                  totalItems={totalItems}
                  appliedCoupon={appliedCoupon}
                  footer={
                    step < 3 ? (
                      <Button
                        radius="xl"
                        fullWidth
                        color="green"
                        rightSection={<ArrowRight size={18} />}
                        styles={buttonStyles}
                        style={{ background: green }}
                        onClick={advance}
                        disabled={!canGoNext()}
                      >
                        Continue
                      </Button>
                    ) : step === 3 ? (
                      <Button
                        radius="xl"
                        fullWidth
                        color="green"
                        leftSection={<CreditCard size={18} />}
                        styles={buttonStyles}
                        style={{ background: green }}
                        onClick={() => void handlePlaceOrder()}
                        loading={isPending}
                        disabled={!canGoNext()}
                      >
                        Place Order &middot; {formatPrice(total)}
                      </Button>
                    ) : null
                  }
                />
                <ContactDetails
                  phone={phone}
                  setPhone={setPhone}
                  onPhoneBlur={() => {
                    void checkSessionAndParticipant();
                    void autofillFromPhone();
                  }}
                  email={email}
                  setEmail={setEmail}
                />
                <TrustIndicators />
              </Box>
            </Grid.Col>
          </Grid>

          {/* Phone-login modal: opens when a delivery phone is entered while not
              authenticated, so the JWT exists before /payments/initialize. On
              success the token is persisted and the shopper can advance past
              delivery to payment. */}
          {loginModalOpened && !isAuthenticated && (
            <CheckoutPhoneLoginModal
              opened
              onClose={() => setLoginModalOpened(false)}
              onSuccess={() => setLoginModalOpened(false)}
              phone={phone}
            />
          )}

          {step < 4 ? (
            <Paper
              radius="lg"
              p="sm"
              withBorder
              style={{
                borderColor: line,
                position: 'sticky',
                bottom: 0,
                zIndex: 5,
                background: '#fff',
              }}
            >
              <Group justify="flex-start">
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
              </Group>
            </Paper>
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
  items: {
    productId?: string;
    name?: string;
    unitPrice?: number;
    quantity: number;
  }[];
  subtotal: number;
  totalItems: number;
}) {
  return (
    <Paper radius={24} p="lg" withBorder style={{ borderColor: line }}>
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
  manualArea,
  setManualArea,
  manualPharmacy,
  setManualPharmacy,
}: {
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state_: string;
  setState_: (v: string) => void;
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
  items: {
    productId?: string;
    name?: string;
    unitPrice?: number;
    quantity: number;
  }[];
  manualArea: string;
  setManualArea: (v: string) => void;
  manualPharmacy: string;
  setManualPharmacy: (v: string) => void;
}) {
  // An area the shopper typed that is not in the published list.
  const typedArea = selectedArea ? '' : manualArea.trim();
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
    <Paper radius={24} p="lg" withBorder style={{ borderColor: line }}>
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
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
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
                  <Stack gap={4}>
                    <Group justify="space-between" wrap="nowrap">
                      <ThemeIcon radius="xl" color="green" variant="light" size="sm">
                        <Icon size={14} />
                      </ThemeIcon>
                      <Radio
                        value={option.value}
                        data-testid={`delivery-mode-radio-${option.value}`}
                      />
                    </Group>
                    <Text fw={800} size="xs" lineClamp={1}>
                      {option.title}
                    </Text>
                    <Text size="xs" c={muted} lineClamp={2}>
                      {option.description}
                    </Text>
                    {option.value === 'pickup' ? (
                      <Button
                        size="compact-xs"
                        variant="light"
                        color="green"
                        radius="xl"
                        leftSection={<Navigation size={12} />}
                        loading={locating}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeliveryMode('pickup');
                          onUseLocation();
                        }}
                        data-testid="pickup-use-location"
                      >
                        Use my location
                      </Button>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Radio.Group>

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
                <Autocomplete
                  label="State"
                  placeholder="Lagos"
                  data={NIGERIAN_STATES}
                  limit={8}
                  radius="xl"
                  value={state_}
                  onChange={setState_}
                  styles={{ input: { borderColor: line } }}
                />
              </Grid.Col>
            </Grid>

            <Autocomplete
              label="Delivery Area"
              description="Pick a listed area or type yours if it isn't shown."
              placeholder={areasLoading ? 'Loading areas...' : 'Area, city or LGA'}
              data={deliveryAreas.map((a) => `${a.city}, ${a.state}`)}
              value={
                manualArea || (selectedArea ? `${selectedArea.city}, ${selectedArea.state}` : '')
              }
              onChange={(value) => {
                setManualArea(value);
                const match = deliveryAreas.find(
                  (a) => `${a.city}, ${a.state}`.toLowerCase() === value.trim().toLowerCase()
                );
                setDeliveryAreaId(match?.id ?? null);
              }}
              radius="xl"
              data-testid="checkout-delivery-area"
            />

            {typedArea ? (
              <Alert
                icon={<AlertTriangle size={16} />}
                color="orange"
                variant="light"
                radius="lg"
                data-testid="checkout-manual-area-note"
              >
                We&apos;ll confirm delivery to <strong>{typedArea}</strong> and the exact fee when
                we call you. The standard delivery fee applies until then.
              </Alert>
            ) : null}

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
            <Text size="sm" c={muted}>
              Choose the pharmacy you&apos;d like to collect from.
            </Text>

            {locationNote ? (
              <Text size="xs" c={muted}>
                {locationNote}
              </Text>
            ) : null}

            {/* Manual fallback: location services are optional, so the shopper
                can name their area and pharmacy by hand. */}
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="City / Area"
                  placeholder="e.g. Ikeja"
                  radius="xl"
                  value={city}
                  onChange={(e) => setCity(e.currentTarget.value)}
                  data-testid="pickup-city"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Autocomplete
                  label="State"
                  placeholder="e.g. Lagos"
                  data={NIGERIAN_STATES}
                  limit={8}
                  radius="xl"
                  value={state_}
                  onChange={setState_}
                  data-testid="pickup-state"
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Pharmacy (if not listed)"
              description="Type the pharmacy you want to collect from."
              placeholder="e.g. Green Cross Pharmacy, Allen Avenue"
              radius="xl"
              value={manualPharmacy}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setManualPharmacy(value);
                // Selecting the typed pharmacy is implicit; clearing unties it.
                setPickupBranchId(value.trim() ? MANUAL_PICKUP_ID : null);
              }}
              data-testid="pickup-manual-pharmacy"
            />

            {branchesLoading ? (
              <Group justify="center" py="md">
                <Loader size="sm" />
              </Group>
            ) : branches.length === 0 ? (
              <Alert icon={<AlertTriangle size={16} />} color="orange" variant="light" radius="lg">
                {locationNote
                  ? 'No pharmacies matched. Enter your area and pharmacy above to continue.'
                  : 'Tap "Use my location", or enter your area and pharmacy above.'}
              </Alert>
            ) : (
              <Radio.Group value={pickupBranchId} onChange={setPickupBranchId}>
                <ScrollArea.Autosize mah={280} type="scroll" offsetScrollbars>
                  <Stack gap="xs" pr={6}>
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
                </ScrollArea.Autosize>
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
  prescriberType,
  setPrescriberType,
  prescriberName,
  setPrescriberName,
  prescriberLicense,
  setPrescriberLicense,
  prescriberPhone,
  setPrescriberPhone,
  prescriptionNotes,
  setPrescriptionNotes,
  rxFiles,
  setRxFiles,
}: {
  rxItems: {
    productId?: string;
    name?: string;
    unitPrice?: number;
    quantity: number;
  }[];
  prescriberType: 'Pharmacist' | 'Doctor' | 'Professional';
  setPrescriberType: (v: 'Pharmacist' | 'Doctor' | 'Professional') => void;
  prescriberName: string;
  setPrescriberName: (v: string) => void;
  prescriberLicense: string;
  setPrescriberLicense: (v: string) => void;
  prescriberPhone: string;
  setPrescriberPhone: (v: string) => void;
  prescriptionNotes: string;
  setPrescriptionNotes: (v: string) => void;
  rxFiles: File[];
  setRxFiles: (files: File[]) => void;
}) {
  const rxFileRef = useRef<HTMLInputElement>(null);
  return (
    <Paper radius={24} p="lg" withBorder style={{ borderColor: line }}>
      <Stack gap="md">
        <Group gap={6}>
          <Stethoscope size={20} color={green} />
          <Text fw={900} size="lg">
            Prescription &amp; Prescriber
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
                  All items in your cart are over-the-counter — you can continue to payment.
                </Text>
              </Box>
            </Group>
          </Paper>
        ) : (
          <>
            <Text size="sm" c={muted}>
              These items require a prescription. Enter the details of the prescriber who issued it
              — a pharmacist, doctor, or other licensed professional.
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

            <Text fw={900} size="sm">
              Prescriber Details
            </Text>

            <Radio.Group
              value={prescriberType}
              onChange={(value) =>
                value && setPrescriberType(value as 'Pharmacist' | 'Doctor' | 'Professional')
              }
            >
              <Group gap="lg" mt={4}>
                <Radio value="Pharmacist" label="Pharmacist" />
                <Radio value="Doctor" label="Doctor" />
                <Radio value="Professional" label="Professional" />
              </Group>
            </Radio.Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Prescriber name"
                  placeholder="e.g. Dr. Jane Doe"
                  radius="xl"
                  value={prescriberName}
                  onChange={(e) => setPrescriberName(e.currentTarget.value)}
                  required
                  styles={{ input: { borderColor: line } }}
                  data-testid="prescriber-name"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="License / registration no."
                  placeholder="e.g. MDCN/12345"
                  radius="xl"
                  value={prescriberLicense}
                  onChange={(e) => setPrescriberLicense(e.currentTarget.value)}
                  styles={{ input: { borderColor: line } }}
                  data-testid="prescriber-license"
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Prescriber phone"
              placeholder="+234 800 000 0000"
              radius="xl"
              value={prescriberPhone}
              onChange={(e) => setPrescriberPhone(e.currentTarget.value)}
              styles={{ input: { borderColor: line } }}
              data-testid="prescriber-phone"
            />

            <Textarea
              label="Prescription notes (optional)"
              placeholder="Issuing facility, prescription reference, or special instructions"
              radius="lg"
              autosize
              minRows={2}
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.currentTarget.value)}
              styles={{ input: { borderColor: line } }}
            />

            <Box>
              <Text size="sm" fw={800} mb={4}>
                Prescription file (optional)
              </Text>
              <Box
                onClick={() => rxFileRef.current?.click()}
                data-testid="prescription-dropzone"
                style={{
                  border: `2px dashed ${line}`,
                  borderRadius: 16,
                  padding: 16,
                  cursor: 'pointer',
                  background: soft,
                }}
              >
                <input
                  ref={rxFileRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setRxFiles(Array.from(e.target.files || []).slice(0, 10))}
                  style={{ display: 'none' }}
                  data-testid="prescription-file-input"
                />
                <Group justify="center" gap="sm" wrap="nowrap">
                  <ThemeIcon radius="xl" color="green" variant="light" size="md">
                    <FileUp size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="sm" fw={700} lineClamp={1}>
                      {rxFiles.length
                        ? `${rxFiles.length} file${rxFiles.length === 1 ? '' : 's'} selected`
                        : 'Click to attach your prescription'}
                    </Text>
                    <Text size="xs" c={muted}>
                      JPG, PNG or PDF · up to 10 files
                    </Text>
                  </Box>
                </Group>
              </Box>
              {rxFiles.length > 0 ? (
                <Group gap={6} mt={6}>
                  {rxFiles.map((f, i) => (
                    <Badge key={`${f.name}-${i}`} radius="xl" color="green" variant="light">
                      {f.name}
                    </Badge>
                  ))}
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="gray"
                    onClick={() => setRxFiles([])}
                  >
                    Clear
                  </Button>
                </Group>
              ) : null}
            </Box>

            {/* Order via chat: opens the pharmacist-technician bot in the
                on-site chatbot with the order payload. */}
            <Group>
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
              Our pharmacists will verify the prescriber&apos;s details and may contact you for
              clarification.
            </Alert>
          </>
        )}
      </Stack>
    </Paper>
  );
}

function ContactDetails({
  phone,
  setPhone,
  onPhoneBlur,
  email,
  setEmail,
}: {
  phone: string;
  setPhone: (v: string) => void;
  onPhoneBlur?: () => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <Paper radius={20} p="md" mt="md" withBorder style={{ borderColor: line }}>
      <Stack gap="sm">
        <Group gap={6}>
          <MessageSquare size={16} color={green} />
          <Text fw={900} size="sm">
            Contact details
          </Text>
        </Group>
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
      </Stack>
    </Paper>
  );
}

function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  total,
  totalItems,
  appliedCoupon,
  footer,
}: {
  items: {
    productId?: string;
    name?: string;
    unitPrice?: number;
    quantity: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalItems: number;
  appliedCoupon: {
    code: string;
    discountAmount: number;
    type?: 'percent' | 'fixed';
  } | null;
  footer?: ReactNode;
}) {
  return (
    <Paper radius={24} p="lg" withBorder style={{ borderColor: line }}>
      <Stack gap="sm">
        <Group gap={6}>
          <ShoppingCart size={18} color={green} />
          <Text fw={900} size="lg">
            Order Summary
          </Text>
        </Group>
        <Divider />

        <ScrollArea.Autosize mah={220} type="scroll" offsetScrollbars>
          <Stack gap={8} pr={4}>
            {items.map((item) => (
              <Group key={item.productId ?? item.name} justify="space-between" wrap="nowrap">
                <Text size="sm" c={muted} lineClamp={2}>
                  {itemLabel(item)} ×{item.quantity}
                </Text>
                <Text fw={700} size="sm" style={{ whiteSpace: 'nowrap' }}>
                  {formatPrice(itemUnitPrice(item) * item.quantity)}
                </Text>
              </Group>
            ))}
          </Stack>
        </ScrollArea.Autosize>

        <Divider />
        <Group justify="space-between">
          <Text c={muted} size="sm">
            Subtotal ({totalItems})
          </Text>
          <Text fw={800} size="sm">
            {formatPrice(subtotal)}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text c={muted} size="sm">
            Delivery Fee
          </Text>
          <Text fw={800} size="sm">
            {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
          </Text>
        </Group>
        {appliedCoupon ? (
          <Group justify="space-between">
            <Text c={green} size="sm">
              Coupon ({appliedCoupon.code})
            </Text>
            <Text fw={800} size="sm" c={green}>
              −{formatPrice(appliedCoupon.discountAmount)}
            </Text>
          </Group>
        ) : null}
        <Divider />
        <Group justify="space-between" align="baseline">
          <Text fw={900} size="lg">
            Total
          </Text>
          <Text fw={950} size="lg" c={darkGreen}>
            {formatPrice(total)}
          </Text>
        </Group>
        {footer}
      </Stack>
    </Paper>
  );
}

function TrustIndicators() {
  const items = [
    { icon: ShieldCheck, title: 'Secure checkout', desc: 'Encrypted end to end' },
    { icon: BadgeCheck, title: 'Authentic medicines', desc: 'Verified pharmacy partners' },
    { icon: Truck, title: 'Fast delivery', desc: 'Same day – 3 days' },
  ];
  return (
    <Paper radius={20} p="md" mt="md" withBorder style={{ borderColor: line, background: soft }}>
      <Stack gap={10}>
        {items.map(({ icon: Icon, title, desc }) => (
          <Group key={title} gap="sm" wrap="nowrap">
            <ThemeIcon radius="xl" size={28} color="green" variant="light">
              <Icon size={15} />
            </ThemeIcon>
            <Box>
              <Text size="xs" fw={700}>
                {title}
              </Text>
              <Text size="xs" c={muted}>
                {desc}
              </Text>
            </Box>
          </Group>
        ))}
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
  appliedCoupon,
  checkingCoupon,
  couponStatus,
  onApplyCoupon,
}: {
  providers: Array<{
    id: string;
    name: string;
    providerType: string;
    production: boolean;
  }>;
  paymentMethod: string | null;
  setPaymentMethod: (v: string | null) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  appliedCoupon: {
    code: string;
    discountAmount: number;
    type?: 'percent' | 'fixed';
  } | null;
  checkingCoupon: boolean;
  couponStatus: { kind: 'idle' | 'error' | 'success'; message: string };
  onApplyCoupon: () => void;
}) {
  return (
    <Paper radius={24} p="lg" withBorder style={{ borderColor: line, background: soft }}>
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
  );
}
