import {
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Anchor,
  Card,
  Image,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { Baby, Heart, ShoppingCart, Sparkles, Stethoscope, User, ChevronRight } from 'lucide-react';
import productPlaceholder from '../sample_images/generic_product_image.png';
import { ProductCard, SectionHeading, green, ink, muted, line, buttonStyles } from './components';
import { ProductLoader } from './loaders';
import { useRecentStore } from './recent-store';
import type { WebsiteProduct } from './types';

function mk(overrides: Partial<WebsiteProduct> & { name: string }): WebsiteProduct {
  const id = overrides.id ?? `mock-${overrides.name.toLowerCase().replace(/\s+/g, '-')}`;
  return {
    id,
    code: overrides.code ?? id.toUpperCase(),
    barcode: null,
    category: overrides.category ?? { id: 'cat-1', name: 'Medicines', code: 'MED' },
    genericProduct: overrides.genericProduct ?? {
      id: `gp-${id}`,
      name: overrides.name,
      dosageForm: 'Tablet',
      strength: null,
      isPrescriptionRequired: false,
      generalUse: 'General wellness',
      pharmaceutics: null,
    },
    baseUomId: 'uom-1',
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const mockPrices: Record<string, number> = {
  'mock-malaria-test-kit': 4500,
  'mock-paracetamol-500mg': 350,
  'mock-vitamin-c-1000mg': 2800,
  'mock-insecticide-treated-net': 6500,
  'mock-artemether-lumefantrine': 3800,
  'mock-mosquito-net': 5500,
  'mock-oral-rehydration-salt': 800,
  'mock-metformin': 1200,
  'mock-glucometer': 8500,
  'mock-glucose-strips': 3500,
  'mock-multivitamin': 2200,
  'mock-amlodipine': 900,
  'mock-lisinopril': 1100,
  'mock-low-salt-diet': 1500,
  'mock-bp-monitor': 12000,
  'mock-salbutamol-inhaler': 4500,
  'mock-prednisolone': 700,
  'mock-peak-flow-meter': 6500,
  'mock-allergy-shield': 3200,
  'mock-general-wellness-pack': 5000,
  'mock-first-aid-kit': 4000,
  'mock-hand-sanitizer': 1200,
  'mock-zinc-supplement': 1800,
  'mock-vitamin-d-1000iu': 2500,
  'mock-ibuprofen-400mg': 600,
  'mock-cetirizine-10mg': 400,
  'mock-omeprazole-20mg': 800,
  'mock-amoxicillin-500mg': 1500,
  'mock-child-multivitamin': 3000,
  'mock-child-fever-medicine': 1200,
  'mock-child-cough-syrup': 1500,
  'mock-folic-acid': 500,
  'mock-prenatal-vitamin': 3500,
  'mock-iron-supplement': 2000,
  'mock-calcium-tablets': 1800,
  'mock-joint-support': 4500,
  'mock-memory-support': 5500,
  'mock-digestive-enzymes': 3000,
  'mock-malaria-artemether-lumefantrine': 3800,
  'mock-malaria-paracetamol': 350,
  'mock-malaria-mosquito-net': 5500,
  'mock-malaria-oral-rehydration-salt': 800,
  'mock-diabetes-metformin': 1200,
  'mock-diabetes-glucometer': 8500,
  'mock-diabetes-glucose-strips': 3500,
  'mock-diabetes-multivitamin': 2200,
  'mock-hypertension-amlodipine': 900,
  'mock-hypertension-lisinopril': 1100,
  'mock-hypertension-low-salt-diet': 1500,
  'mock-hypertension-bp-monitor': 12000,
  'mock-asthma-salbutamol-inhaler': 4500,
  'mock-asthma-prednisolone': 700,
  'mock-asthma-peak-flow-meter': 6500,
  'mock-asthma-allergy-shield': 3200,
};

function formatPrice(n: number) {
  return `₦${n.toLocaleString()}`;
}

export function SectionWrapper({
  eyebrow,
  title,
  children,
  isLoading,
  isEmpty,
  emptyComponent,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyComponent?: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <Box py="xl">
        <Stack gap="lg">
          <SectionHeading eyebrow={eyebrow} title={title} />
          <ProductLoader count={4} />
        </Stack>
      </Box>
    );
  }

  if (isEmpty) {
    return (
      <Box py="xl">
        <Stack gap="lg">
          <SectionHeading eyebrow={eyebrow} title={title} />
          {emptyComponent ?? (
            <Text c={muted} ta="center" py="xl">
              No items to show.
            </Text>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box py="xl">
      <Stack gap="lg">
        <SectionHeading eyebrow={eyebrow} title={title} />
        {children}
      </Stack>
    </Box>
  );
}

function PriceTag({ price }: { price: number }) {
  return (
    <Text fw={900} size="lg" c={green}>
      {formatPrice(price)}
    </Text>
  );
}

// ── Frequently Bought Together ───────────────────────────────────

const frequentlyBoughtData: WebsiteProduct[] = [
  mk({
    name: 'Malaria Test Kit',
    id: 'mock-malaria-test-kit',
    genericProduct: {
      id: 'gp-malaria-test-kit',
      name: 'Malaria Test Kit',
      dosageForm: 'Test Kit',
      strength: null,
      isPrescriptionRequired: false,
      generalUse: 'Malaria diagnosis',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Paracetamol 500mg',
    id: 'mock-paracetamol-500mg',
    genericProduct: {
      id: 'gp-paracetamol',
      name: 'Paracetamol',
      dosageForm: 'Tablet',
      strength: '500mg',
      isPrescriptionRequired: false,
      generalUse: 'Pain and fever relief',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Vitamin C 1000mg',
    id: 'mock-vitamin-c-1000mg',
    genericProduct: {
      id: 'gp-vitamin-c',
      name: 'Ascorbic Acid',
      dosageForm: 'Tablet',
      strength: '1000mg',
      isPrescriptionRequired: false,
      generalUse: 'Immune support',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Insecticide Treated Net',
    id: 'mock-insecticide-treated-net',
    genericProduct: {
      id: 'gp-mosquito-net',
      name: 'Insecticide Treated Net',
      dosageForm: 'Net',
      strength: null,
      isPrescriptionRequired: false,
      generalUse: 'Malaria prevention',
      pharmaceutics: null,
    },
  }),
];

export function FrequentlyBought({ productId: _productId }: { productId?: string }) {
  const total = frequentlyBoughtData.reduce((sum, p) => sum + (mockPrices[p.id] ?? 0), 0);

  return (
    <Box py="xl">
      <Stack gap="lg">
        <SectionHeading eyebrow="Bundle & Save" title="Frequently Bought Together" />
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {frequentlyBoughtData.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </SimpleGrid>
        <Paper p="md" radius={16} withBorder style={{ borderColor: line, background: '#F7FBF9' }}>
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group gap="xs">
              <Text c={muted} size="sm">
                Total:
              </Text>
              <PriceTag price={total} />
            </Group>
            <Button
              radius="xl"
              size="md"
              leftSection={<ShoppingCart size={18} />}
              styles={buttonStyles}
              style={{ background: green }}
            >
              Add all to cart
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Box>
  );
}

// ── Related Products ─────────────────────────────────────────────

const relatedProductsData: WebsiteProduct[] = [
  mk({
    name: 'Amoxicillin 500mg',
    id: 'mock-amoxicillin-500mg',
    genericProduct: {
      id: 'gp-amoxicillin',
      name: 'Amoxicillin',
      dosageForm: 'Capsule',
      strength: '500mg',
      isPrescriptionRequired: true,
      generalUse: 'Bacterial infections',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Ibuprofen 400mg',
    id: 'mock-ibuprofen-400mg',
    genericProduct: {
      id: 'gp-ibuprofen',
      name: 'Ibuprofen',
      dosageForm: 'Tablet',
      strength: '400mg',
      isPrescriptionRequired: false,
      generalUse: 'Pain and inflammation',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Cetirizine 10mg',
    id: 'mock-cetirizine-10mg',
    genericProduct: {
      id: 'gp-cetirizine',
      name: 'Cetirizine',
      dosageForm: 'Tablet',
      strength: '10mg',
      isPrescriptionRequired: false,
      generalUse: 'Allergy relief',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Omeprazole 20mg',
    id: 'mock-omeprazole-20mg',
    genericProduct: {
      id: 'gp-omeprazole',
      name: 'Omeprazole',
      dosageForm: 'Capsule',
      strength: '20mg',
      isPrescriptionRequired: false,
      generalUse: 'Acid reflux treatment',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Vitamin D 1000IU',
    id: 'mock-vitamin-d-1000iu',
    genericProduct: {
      id: 'gp-vitamin-d',
      name: 'Cholecalciferol',
      dosageForm: 'Tablet',
      strength: '1000IU',
      isPrescriptionRequired: false,
      generalUse: 'Bone health',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Zinc Supplement',
    id: 'mock-zinc-supplement',
    genericProduct: {
      id: 'gp-zinc',
      name: 'Zinc',
      dosageForm: 'Tablet',
      strength: '15mg',
      isPrescriptionRequired: false,
      generalUse: 'Immune support',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'First Aid Kit',
    id: 'mock-first-aid-kit',
    genericProduct: {
      id: 'gp-first-aid',
      name: 'First Aid Kit',
      dosageForm: 'Kit',
      strength: null,
      isPrescriptionRequired: false,
      generalUse: 'Emergency care',
      pharmaceutics: null,
    },
  }),
  mk({
    name: 'Hand Sanitizer',
    id: 'mock-hand-sanitizer',
    genericProduct: {
      id: 'gp-sanitizer',
      name: 'Hand Sanitizer',
      dosageForm: 'Gel',
      strength: null,
      isPrescriptionRequired: false,
      generalUse: 'Hand hygiene',
      pharmaceutics: null,
    },
  }),
];

export function RelatedProducts({ productId: _productId }: { productId?: string }) {
  return (
    <Box py="xl">
      <Stack gap="lg">
        <SectionHeading eyebrow="Recommended" title="Related Products" />
        <Box
          style={{
            overflowX: 'auto',
            display: 'flex',
            gap: 16,
            paddingBottom: 8,
            scrollSnapType: 'x mandatory',
          }}
        >
          {relatedProductsData.map((product) => (
            <Box
              key={product.id}
              style={{ minWidth: 260, maxWidth: 260, scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} />
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

// ── Customers Also Purchased ─────────────────────────────────────

const alsoPurchasedData: WebsiteProduct[] = [
  mk({ name: 'First Aid Kit', id: 'mock-first-aid-kit' }),
  mk({ name: 'Hand Sanitizer', id: 'mock-hand-sanitizer' }),
  mk({ name: 'Zinc Supplement', id: 'mock-zinc-supplement' }),
  mk({ name: 'Vitamin D 1000IU', id: 'mock-vitamin-d-1000iu' }),
];

export function AlsoPurchased({ productId: _productId }: { productId?: string }) {
  return (
    <Box py="xl">
      <Stack gap="lg">
        <SectionHeading eyebrow="Customers Also Bought" title="Customers Also Purchased" />
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {alsoPurchasedData.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}

// ── Recently Viewed ──────────────────────────────────────────────

export function RecentlyViewed() {
  const { items } = useRecentStore();

  const recentProducts: WebsiteProduct[] = items.map((item) =>
    mk({
      id: item.productId,
      name: item.name,
    })
  );

  return (
    <Box py="xl">
      <Stack gap="lg">
        <SectionHeading eyebrow="Continue Browsing" title="Recently Viewed" />
        {recentProducts.length === 0 ? (
          <Paper p="xl" radius={24} withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <Stack align="center" gap="sm">
              <ThemeIcon radius="xl" size={60} color="green" variant="light">
                <Heart size={28} />
              </ThemeIcon>
              <Text c={muted}>No recently viewed items yet. Start browsing to see them here.</Text>
            </Stack>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}

// ── Recommended For Your Condition ───────────────────────────────

const conditionProducts: Record<string, WebsiteProduct[]> = {
  malaria: [
    mk({
      name: 'Artemether/Lumefantrine',
      id: 'mock-malaria-artemether-lumefantrine',
      genericProduct: {
        id: 'gp-artemether-lumefantrine',
        name: 'Artemether/Lumefantrine',
        dosageForm: 'Tablet',
        strength: '20/120mg',
        isPrescriptionRequired: true,
        generalUse: 'Malaria treatment',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Paracetamol',
      id: 'mock-malaria-paracetamol',
      genericProduct: {
        id: 'gp-paracetamol-malaria',
        name: 'Paracetamol',
        dosageForm: 'Tablet',
        strength: '500mg',
        isPrescriptionRequired: false,
        generalUse: 'Fever relief',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Mosquito Net',
      id: 'mock-malaria-mosquito-net',
      genericProduct: {
        id: 'gp-mosquito-net-malaria',
        name: 'Insecticide Treated Net',
        dosageForm: 'Net',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Malaria prevention',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Oral Rehydration Salt',
      id: 'mock-malaria-oral-rehydration-salt',
      genericProduct: {
        id: 'gp-ors',
        name: 'Oral Rehydration Salts',
        dosageForm: 'Powder',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Dehydration management',
        pharmaceutics: null,
      },
    }),
  ],
  diabetes: [
    mk({
      name: 'Metformin',
      id: 'mock-diabetes-metformin',
      genericProduct: {
        id: 'gp-metformin',
        name: 'Metformin',
        dosageForm: 'Tablet',
        strength: '500mg',
        isPrescriptionRequired: true,
        generalUse: 'Type 2 diabetes management',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Glucometer',
      id: 'mock-diabetes-glucometer',
      genericProduct: {
        id: 'gp-glucometer',
        name: 'Blood Glucose Meter',
        dosageForm: 'Device',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Blood sugar monitoring',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Glucose Strips',
      id: 'mock-diabetes-glucose-strips',
      genericProduct: {
        id: 'gp-glucose-strips',
        name: 'Glucose Test Strips',
        dosageForm: 'Strip',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Blood sugar testing',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Multivitamin',
      id: 'mock-diabetes-multivitamin',
      genericProduct: {
        id: 'gp-multivitamin',
        name: 'Multivitamin Formula',
        dosageForm: 'Tablet',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Nutritional support',
        pharmaceutics: null,
      },
    }),
  ],
  hypertension: [
    mk({
      name: 'Amlodipine',
      id: 'mock-hypertension-amlodipine',
      genericProduct: {
        id: 'gp-amlodipine',
        name: 'Amlodipine',
        dosageForm: 'Tablet',
        strength: '5mg',
        isPrescriptionRequired: true,
        generalUse: 'Blood pressure control',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Lisinopril',
      id: 'mock-hypertension-lisinopril',
      genericProduct: {
        id: 'gp-lisinopril',
        name: 'Lisinopril',
        dosageForm: 'Tablet',
        strength: '10mg',
        isPrescriptionRequired: true,
        generalUse: 'Blood pressure control',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Low Salt Diet',
      id: 'mock-hypertension-low-salt-diet',
      genericProduct: {
        id: 'gp-low-salt',
        name: 'Low Sodium Diet Plan',
        dosageForm: 'Supplement',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Dietary management',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'BP Monitor',
      id: 'mock-hypertension-bp-monitor',
      genericProduct: {
        id: 'gp-bp-monitor',
        name: 'Digital Blood Pressure Monitor',
        dosageForm: 'Device',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Blood pressure monitoring',
        pharmaceutics: null,
      },
    }),
  ],
  asthma: [
    mk({
      name: 'Salbutamol Inhaler',
      id: 'mock-asthma-salbutamol-inhaler',
      genericProduct: {
        id: 'gp-salbutamol',
        name: 'Salbutamol',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        isPrescriptionRequired: true,
        generalUse: 'Asthma relief',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Prednisolone',
      id: 'mock-asthma-prednisolone',
      genericProduct: {
        id: 'gp-prednisolone',
        name: 'Prednisolone',
        dosageForm: 'Tablet',
        strength: '5mg',
        isPrescriptionRequired: true,
        generalUse: 'Anti-inflammatory',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Peak Flow Meter',
      id: 'mock-asthma-peak-flow-meter',
      genericProduct: {
        id: 'gp-peak-flow',
        name: 'Peak Flow Meter',
        dosageForm: 'Device',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Lung function monitoring',
        pharmaceutics: null,
      },
    }),
    mk({
      name: 'Allergy Shield',
      id: 'mock-asthma-allergy-shield',
      genericProduct: {
        id: 'gp-allergy-shield',
        name: 'Allergy Relief Shield',
        dosageForm: 'Spray',
        strength: null,
        isPrescriptionRequired: false,
        generalUse: 'Allergy protection',
        pharmaceutics: null,
      },
    }),
  ],
  default: [
    mk({ name: 'Multivitamin', id: 'mock-multivitamin' }),
    mk({ name: 'Vitamin C 1000mg', id: 'mock-vitamin-c-1000mg' }),
    mk({ name: 'Zinc Supplement', id: 'mock-zinc-supplement' }),
    mk({ name: 'Hand Sanitizer', id: 'mock-hand-sanitizer' }),
  ],
};

export function RecommendedForCondition({ conditionSlug }: { conditionSlug?: string }) {
  const products =
    conditionSlug && conditionProducts[conditionSlug]
      ? conditionProducts[conditionSlug]
      : conditionProducts.default;

  const conditionName = conditionSlug
    ? conditionSlug.charAt(0).toUpperCase() + conditionSlug.slice(1)
    : 'General Wellness';

  return (
    <Box py="xl">
      <Stack gap="lg">
        <SectionHeading eyebrow="Health-matched picks" title={`Recommended For ${conditionName}`} />
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}

// ── Family Care Suggestions ──────────────────────────────────────

const familyCategories = [
  {
    title: 'Child Health',
    icon: Baby,
    description: 'Vitamins, fever management, cough & cold remedies for children.',
    color: '#0EA5E9',
    bgColor: 'rgba(14, 165, 233, 0.08)',
    products: ['Child Multivitamin', 'Child Fever Medicine', 'Child Cough Syrup'],
    productIds: ['mock-child-multivitamin', 'mock-child-fever-medicine', 'mock-child-cough-syrup'],
  },
  {
    title: "Women's Health",
    icon: User,
    description: 'Prenatal vitamins, iron supplements, folic acid & feminine care.',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.08)',
    products: ['Folic Acid', 'Prenatal Vitamin', 'Iron Supplement'],
    productIds: ['mock-folic-acid', 'mock-prenatal-vitamin', 'mock-iron-supplement'],
  },
  {
    title: 'Senior Care',
    icon: Heart,
    description: 'Joint support, memory care, blood pressure monitors & more.',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.08)',
    products: ['Calcium Tablets', 'Joint Support', 'Memory Support'],
    productIds: ['mock-calcium-tablets', 'mock-joint-support', 'mock-memory-support'],
  },
];

export function FamilyCareSuggestions() {
  const navigate = useNavigate();

  return (
    <Box py="xl">
      <Stack gap="lg">
        <SectionHeading
          eyebrow="Care for the whole family"
          title="Family Care Suggestions"
          text="Health and wellness products curated for every member of your family."
        />
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {familyCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Paper
                key={cat.title}
                radius={24}
                p="xl"
                withBorder
                style={{
                  borderColor: line,
                  background: '#fff',
                  boxShadow: '0 18px 52px rgba(15, 23, 42, 0.06)',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  navigate({
                    to: `/shop/shop?category=${cat.title.toLowerCase().replace(/\s+/g, '-')}`,
                  })
                }
              >
                <Stack gap="md">
                  <ThemeIcon radius="xl" size={50} style={{ background: cat.bgColor }}>
                    <Icon size={24} color={cat.color} />
                  </ThemeIcon>
                  <Text fw={900} size="lg" c={ink}>
                    {cat.title}
                  </Text>
                  <Text c={muted} size="sm" lh={1.7}>
                    {cat.description}
                  </Text>
                  <Stack gap="xs">
                    {cat.products.map((name) => (
                      <Group key={name} gap="xs">
                        <Sparkles size={14} color={green} />
                        <Text size="sm" c={ink}>
                          {name}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                  <Anchor
                    underline="never"
                    c={green}
                    fw={900}
                    size="sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Shop {cat.title} <ChevronRight size={14} />
                  </Anchor>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
