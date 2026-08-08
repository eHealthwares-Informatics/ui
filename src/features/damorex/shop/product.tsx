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
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  BadgeCheck,
  Clock3,
  MessageCircle,
  MessageSquare,
  Minus,
  Pill,
  Plus,
  ShieldCheck,
  ShoppingCart,
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
import productPlaceholder from '../sample_images/generic_product_image.png';
import { useCartStore } from '../website/cart-store';
import { ProductCard } from '../website/components';
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
  const { slug } = useParams({ from: '/damorex/shop_/$slug' });
  const { data, isLoading } = useProduct(slug);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const totalItems = useCartStore((s) => s.totalItems);
  const [quantity, setQuantity] = useState(1);

  const product = data?.product;
  const gp = product?.genericProduct;
  const pharm = gp?.pharmaceutics;
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
                        {pharm.dosage ? (
                          <Text size="sm">
                            <strong>Dosage:</strong> {pharm.dosage}
                          </Text>
                        ) : null}
                      </Stack>
                    </Paper>
                  ) : null}

                  <Group gap="sm">
                    {gp?.isPrescriptionRequired ? (
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

                  {pharm?.indications ? (
                    <Box>
                      <Text fw={900} size="lg">
                        Indications
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.indications}
                      </Text>
                    </Box>
                  ) : null}

                  <Paper radius={20} p="md" withBorder style={{ borderColor: line }}>
                    <Stack gap="md">
                      <Group>
                        <Text fw={950} size="xl" c={darkGreen}>
                          ₦{product.code?.length ? product.code.length * 500 : 0}
                        </Text>
                        <Text size="sm" c={muted}>
                          per unit
                        </Text>
                      </Group>

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
                          onClick={() => addItem(product.id, quantity)}
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
                    {totalItems > 0 ? (
                      <Button
                        radius="xl"
                        size="md"
                        variant="filled"
                        color="green"
                        fullWidth
                        leftSection={<ShoppingCart size={18} />}
                        styles={buttonStyles}
                        onClick={() => navigate({ to: '/damorex/checkout' })}
                      >
                        Checkout ({totalItems} item{totalItems !== 1 ? 's' : ''})
                      </Button>
                    ) : null}
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>
            </Grid>

            {pharm?.contraindications ? (
              <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
                <Title order={3} className="damorex-heading" mb="md">
                  Drug Information
                </Title>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  {pharm.contraindications ? (
                    <Box>
                      <Text fw={900} mb={4}>
                        Contraindications
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {pharm.contraindications}
                      </Text>
                    </Box>
                  ) : null}
                </SimpleGrid>
              </Paper>
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
