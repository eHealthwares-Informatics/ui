import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Image,
  Paper,
  Rating,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  BadgeCheck,
  MessageCircle,
  MessageSquare,
  Minus,
  Pill,
  Plus,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useChatbotStore } from '../website/chatbot-store';
import {
  toHL7Prescription,
  buildWhatsAppUrl,
  WEBSITE_PRESCRIPTION_PHONE,
  QUESTIONNAIRE_CODES,
} from '../website/hl7-prescription';
import productPlaceholder from '../sample_images/generic_product_image.png';
import { useCartStore } from '../website/cart-store';
import { ProductCard, BrandCountLink } from '../website/components';
import { EmptyProducts } from '../website/empty-states';
import { useProduct } from '../website/hooks';
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
import { PageLoader } from '../website/loaders';

export default function ProductDetailPage() {
  const { slug } = useParams({ from: '/shop/shop_/$slug' });
  const { data, isLoading } = useProduct(slug);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const addGenericItem = useCartStore((s) => s.addGenericItem);
  const totalItems = useCartStore((s) => s.totalItems);
  const [quantity, setQuantity] = useState(1);

  const product = data?.product;
  const gp = (data?.genericProduct ?? product?.genericProduct ?? null) as
    | {
        id?: string | null;
        name?: string | null;
        strength?: string | null;
        dosageForm?: string | null;
        isPrescriptionRequired?: boolean;
        therapeuticClass?: string | null;
        adultDosage?: string | null;
        pediatricDosage?: string | null;
        isControlledSubstance?: boolean;
        pharmaceutics?: {
          commonBrandName?: string | null;
          commonGenericName?: string | null;
          clinicalName?: string | null;
          drugClass?: string | null;
          dosage?: string | null;
          indications?: string | null;
          contraindications?: string | null;
          mechanism?: string | null;
          pharmaceutics?: string | null;
        } | null;
      }
    | null;
  const pharm = gp?.pharmaceutics ?? null;

  const hasDrugInfo = Boolean(
    gp?.dosageForm ||
      gp?.therapeuticClass ||
      gp?.adultDosage ||
      gp?.pediatricDosage ||
      gp?.isControlledSubstance ||
      pharm?.commonBrandName ||
      pharm?.commonGenericName ||
      pharm?.clinicalName ||
      pharm?.drugClass ||
      pharm?.dosage ||
      pharm?.indications ||
      pharm?.contraindications ||
      pharm?.mechanism ||
      pharm?.pharmaceutics,
  );
  const drug = data?.genericDrug ?? product?.genericDrug ?? null;
  const classifications = data?.classifications;
  const frequentlyBought = data?.frequentlyBought ?? [];
  // Server resolves the concepts flag; fall back to the nested product, else no-Rx.
  const rxRequired =
    product?.isPrescriptionRequired ?? gp?.isPrescriptionRequired ?? false;

  const goClassify = (code: string) =>
    navigate({ to: '/shop/shop', search: { classificationCode: code } as any });

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        {isLoading ? (
          <PageLoader />
        ) : !product ? (
          <EmptyProducts
            title="Product not found"
            message="The product you're looking for doesn't exist or has been removed."
          />
        ) : (
          <Stack gap="xl">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper
                  radius={32}
                  p={0}
                  style={{
                    overflow: 'hidden',
                    background: '#F1F8F4',
                    border: `1px solid ${line}`,
                  }}
                >
                  <Image src={product.mediumImageUrl || product.imageUrl || productPlaceholder} alt={product.name} h={400} fit="contain" p="xl" />
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="lg">
                  <Box>
                    <Text size="sm" c={muted} tt="uppercase" fw={800} lts={1.2}>
                      {product.code}
                    </Text>
                    <Title
                      order={1}
                      className="damorex-heading"
                      style={{ color: ink, marginTop: 4 }}
                    >
                      {product.name}
                    </Title>
                    {gp ? (
                      <Text size="lg" c={muted} lh={1.7}>
                        {gp.name}
                      </Text>
                    ) : null}
                    {(gp?.strength || gp?.dosageForm) ? (
                      <Group gap="xs">
                        {gp?.strength ? (
                          <Badge size="lg" radius="xl" variant="light" color="teal">
                            {gp.strength}
                          </Badge>
                        ) : null}
                        {gp?.dosageForm ? (
                          <Badge size="lg" radius="xl" variant="light" color="teal">
                            {gp.dosageForm}
                          </Badge>
                        ) : null}
                      </Group>
                    ) : null}
                    {product.unitPrice != null && (
                      <Text fw={700} size="28px" c={green}>
                        ₦{product.unitPrice.toLocaleString()}
                      </Text>
                    )}
                  </Box>

                  {pharm ? (
                    <Paper
                      radius={20}
                      p="md"
                      style={{ background: soft, border: `1px solid ${line}` }}
                    >
                      <Stack gap="xs">
                        {pharm.commonBrandName ? (
                          <Text size="sm">
                            <strong>Brand:</strong> {pharm.commonBrandName}
                          </Text>
                        ) : null}
                        {pharm.commonGenericName ? (
                          <Text size="sm">
                            <strong>Generic Name:</strong> {pharm.commonGenericName}
                          </Text>
                        ) : null}
                        {pharm.drugClass ? (
                          <Text size="sm">
                            <strong>Drug Class:</strong> {pharm.drugClass}
                          </Text>
                        ) : null}
                        {pharm.dosage ? (
                          <Text size="sm">
                            <strong>Dosage:</strong> {pharm.dosage}
                          </Text>
                        ) : null}
                      </Stack>
                    </Paper>
                  ) : null}

                  <Paper radius={20} p="md" withBorder style={{ borderColor: line }}>
                    <Stack gap="md">
                      <Group>
                        <Text fw={950} size="xl" c={darkGreen}>
                          {product.unitPrice != null ? `₦${product.unitPrice.toLocaleString()}` : 'Price on request'}
                        </Text>
                        <Text size="sm" c={muted}>
                          per unit
                        </Text>
                      </Group>
                      <Text size="xs" c={muted} fs="italic">
                        Prices may vary due to market fluctuations
                      </Text>

                      <Group gap={8}>
                        <Button
                          radius="xl"
                          variant="light"
                          color="gray"
                          size="sm"
                          p={8}
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus size={16} />
                        </Button>
                        <Text fw={900} size="lg" style={{ minWidth: 32, textAlign: 'center' }}>
                          {quantity}
                        </Text>
                        <Button
                          radius="xl"
                          variant="light"
                          color="gray"
                          size="sm"
                          p={8}
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </Group>

                      <Group grow>
                        <Button
                          radius="xl"
                          size="md"
                          leftSection={<ShoppingCart size={18} />}
                          styles={buttonStyles}
                          style={{ background: green }}
                          onClick={() => {
                            addItem(product.id, quantity, {
                              name: product.name,
                              unitPrice: product.unitPrice ?? undefined,
                              product,
                            });
                            const count = useCartStore.getState().totalItems;
                            notifications.show({
                              position: 'bottom-right',
                              title: 'Added to cart',
                              message: `${count} item${count === 1 ? '' : 's'} in cart — ${product.name}`,
                              color: 'green',
                              icon: <ShoppingCart size={18} />,
                            });
                          }}
                        >
                          Add to Cart
                        </Button>
                        <Button
                          radius="xl"
                          size="md"
                          variant="light"
                          color="green"
                          leftSection={<MessageCircle size={18} />}
                          styles={buttonStyles}
                          onClick={() => {
                            const hl7 = toHL7Prescription(
                              { product, quantity },
                              { questionnaireCode: QUESTIONNAIRE_CODES.PRODUCT_INQUIRY, customerName: product.name },
                            );
                            window.open(
                              buildWhatsAppUrl(hl7, WEBSITE_PRESCRIPTION_PHONE, QUESTIONNAIRE_CODES.PRODUCT_INQUIRY),
                              '_blank',
                            );
                          }}
                        >
                          WhatsApp
                        </Button>
                        <Button
                          radius="xl"
                          size="md"
                          variant="filled"
                          color="blue"
                          leftSection={<MessageSquare size={18} />}
                          styles={buttonStyles}
                          onClick={() => {
                            const hl7 = toHL7Prescription(
                              { product, quantity },
                              { questionnaireCode: QUESTIONNAIRE_CODES.PRODUCT_INQUIRY, customerName: product.name },
                            );
                            useChatbotStore.getState().openWith(hl7, QUESTIONNAIRE_CODES.PRODUCT_INQUIRY);
                          }}
                        >
                          Chat
                        </Button>
                      </Group>
                      {gp ? (
                        <Button
                          radius="xl"
                          size="md"
                          variant="light"
                          color="green"
                          fullWidth
                          leftSection={<Pill size={18} />}
                          styles={buttonStyles}
                          onClick={() => {
                            addGenericItem({
                              name: gp.name || product.name,
                              genericProductCode: gp.id ?? '',
                              unitPrice: product.unitPrice ?? 0,
                            });
                            notifications.show({
                              message: `${gp.name || product.name} (generic) added to cart`,
                              color: 'green',
                              icon: <ShoppingCart size={18} />,
                            });
                          }}
                        >
                          Add Generic (Available brand)
                        </Button>
                      ) : null}
                      {totalItems > 0 ? (
                        <Button
                          radius="xl"
                          size="md"
                          variant="filled"
                          color="green"
                          fullWidth
                          leftSection={<ShoppingCart size={18} />}
                          styles={buttonStyles}
                          onClick={() => navigate({ to: '/shop/checkout' })}
                        >
                          Checkout ({totalItems} item{totalItems !== 1 ? 's' : ''})
                        </Button>
                      ) : null}
                    </Stack>
                  </Paper>

                  {drug ? (
                    <Paper radius={20} p="md" withBorder style={{ borderColor: line }}>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={900} size="lg">Drug Information</Text>
                          <Badge radius="xl" variant="light" color="green">{drug.code}</Badge>
                        </Group>
                        <Text size="sm"><strong>Generic Drug:</strong> {drug.name}</Text>
                        {drug.genericClass ? (
                          <Text size="sm"><strong>Therapeutic Class:</strong> {drug.genericClass}</Text>
                        ) : null}
                        {drug.pharmaceuticalClass ? (
                          <Text size="sm"><strong>Pharmaceutical Class:</strong> {drug.pharmaceuticalClass}</Text>
                        ) : null}
                        <Group gap="md">
                          {typeof drug.brandCount === 'number' && drug.brandCount > 0 ? (
                            <BrandCountLink code={drug.code} brandCount={drug.brandCount} />
                          ) : null}
                          {drug.averagePrice != null ? (
                            <Text size="sm" c={muted}>Avg. ₦{drug.averagePrice.toLocaleString()}</Text>
                          ) : null}
                        </Group>
                      </Stack>
                    </Paper>
                  ) : null}

                  {classifications && Object.values(classifications).some((arr) => arr.length > 0) ? (
                    <Stack gap="xs">
                      {(['therapeutic', 'pharmaceutical', 'ndf', 'emdex'] as const).map((type) => {
                        const list = classifications[type] ?? [];
                        if (list.length === 0) return null;
                        return (
                          <Group key={type} gap={6}>
                            <Text size="xs" c={muted} fw={700} w={110}>
                              {type === 'therapeutic'
                                ? 'Therapeutic:'
                                : type === 'pharmaceutical'
                                  ? 'Pharmaceutical:'
                                  : type === 'ndf'
                                    ? 'NDF/EDL:'
                                    : 'EMDEx:'}
                            </Text>
                            {list.map((c) => (
                              <Badge
                                key={c.code}
                                radius="xl"
                                variant="light"
                                color="green"
                                style={{ cursor: 'pointer' }}
                                onClick={() => goClassify(c.code)}
                              >
                                {c.name}
                              </Badge>
                            ))}
                          </Group>
                        );
                      })}
                    </Stack>
                  ) : null}

                  <Group gap="sm">
                    {rxRequired ? (
                      <Badge size="lg" radius="xl" color="orange" leftSection={<Pill size={14} />}>
                        Prescription required
                      </Badge>
                    ) : (
                      <Badge
                        size="lg"
                        radius="xl"
                        color="green"
                        leftSection={<BadgeCheck size={14} />}
                      >
                        No prescription needed
                      </Badge>
                    )}
                    <Badge
                      size="lg"
                      radius="xl"
                      color="green"
                      variant="light"
                      leftSection={<Truck size={14} />}
                    >
                      In stock
                    </Badge>
                  </Group>

                </Stack>
              </Grid.Col>
            </Grid>

            {hasDrugInfo ? (
              <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
                <Title order={3} className="damorex-heading" mb="md">
                  Drug Information
                </Title>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  {gp?.dosageForm ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Dosage Form
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {gp.dosageForm}
                        {gp.strength ? ` — ${gp.strength}` : ''}
                      </Text>
                    </Box>
                  ) : null}
                  {gp?.therapeuticClass ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Therapeutic Class
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {gp.therapeuticClass}
                      </Text>
                    </Box>
                  ) : null}
                  {pharm?.drugClass ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Drug Class
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.drugClass}
                      </Text>
                    </Box>
                  ) : null}
                  {pharm?.indications ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Indications
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.indications}
                      </Text>
                    </Box>
                  ) : null}
                  {pharm?.contraindications ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Contraindications
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.contraindications}
                      </Text>
                    </Box>
                  ) : null}
                  {gp?.adultDosage ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Adult Dosage
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {gp.adultDosage}
                      </Text>
                    </Box>
                  ) : null}
                  {gp?.pediatricDosage ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Pediatric Dosage
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {gp.pediatricDosage}
                      </Text>
                    </Box>
                  ) : null}
                  {pharm?.dosage ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Dosage & Administration
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.dosage}
                      </Text>
                    </Box>
                  ) : null}
                  {pharm?.mechanism ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Mechanism of Action
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.mechanism}
                      </Text>
                    </Box>
                  ) : null}
                  {pharm?.pharmaceutics ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Pharmaceutics
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.pharmaceutics}
                      </Text>
                    </Box>
                  ) : null}
                  {pharm?.commonBrandName || pharm?.commonGenericName || pharm?.clinicalName ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Names
                      </Text>
                      <Stack gap={2}>
                        {pharm?.commonBrandName ? (
                          <Text size="sm" c={muted}>
                            <strong style={{ color: ink }}>Brand:</strong> {pharm.commonBrandName}
                          </Text>
                        ) : null}
                        {pharm?.commonGenericName ? (
                          <Text size="sm" c={muted}>
                            <strong style={{ color: ink }}>Generic:</strong> {pharm.commonGenericName}
                          </Text>
                        ) : null}
                        {pharm?.clinicalName ? (
                          <Text size="sm" c={muted}>
                            <strong style={{ color: ink }}>Clinical:</strong> {pharm.clinicalName}
                          </Text>
                        ) : null}
                      </Stack>
                    </Box>
                  ) : null}
                  {gp?.isControlledSubstance ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Controlled Substance
                      </Text>
                      <Badge size="lg" radius="xl" color="red" variant="light" w="fit-content">
                        Restricted — special handling applies
                      </Badge>
                    </Box>
                  ) : null}
                </SimpleGrid>
              </Paper>
            ) : null}

            {frequentlyBought.length > 0 ? (
              <Box>
                <Title order={3} className="damorex-heading" mb="md">
                  Frequently Bought Together
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {frequentlyBought.map((p) => (
                    <Paper key={p.id} radius={20} p="md" withBorder style={{ borderColor: line }}>
                      <Stack gap="sm">
                        <ProductCard product={p} />
                        <Button
                          radius="xl"
                          variant="light"
                          color="green"
                          leftSection={<ShoppingCart size={16} />}
                          styles={buttonStyles}
                          onClick={() => {
                            addItem(p.id, 1, { name: p.name, unitPrice: p.unitPrice ?? undefined, product: p });
                            notifications.show({
                              message: `${p.name} added to cart`,
                              color: 'green',
                              icon: <ShoppingCart size={18} />,
                            });
                          }}
                        >
                          Add to Cart
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </SimpleGrid>
              </Box>
            ) : null}

            {data?.reviews && data.reviews.length > 0 ? (
              <Box>
                <Title order={3} className="damorex-heading" mb="md">
                  Customer Reviews
                </Title>
                <Stack gap="sm">
                  {data.reviews.map((review) => (
                    <Paper
                      key={review.id}
                      radius={20}
                      p="md"
                      withBorder
                      style={{ borderColor: line }}
                    >
                      <Group justify="space-between" mb={4}>
                        <Text fw={800}>{review.name || 'Anonymous'}</Text>
                        <Rating value={review.rating} readOnly />
                      </Group>
                      {review.comment ? (
                        <Text c={muted} lh={1.7}>
                          {review.comment}
                        </Text>
                      ) : null}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ) : null}

            {data?.related && data.related.length > 0 ? (
              <Box>
                <Title order={3} className="damorex-heading" mb="md">
                  Related Products
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                  {data.related.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </SimpleGrid>
              </Box>
            ) : null}
          </Stack>
        )}
      </Container>
    </WebsiteLayout>
  );
}
