import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGenericDrug } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  ink,
  muted,
  line,
  buttonStyles,
} from '../website/layout';
import { useCartStore } from '../website/cart-store';

export default function ShopMedicineDetailPage({ code }: { code: string }) {
  const navigate = useNavigate();
  const { data: drug, isLoading } = useGenericDrug(code);
  const addGenericDrug = useCartStore((s) => s.addGenericDrug);
  const addItem = useCartStore((s) => s.addItem);

  function addGeneric() {
    if (!drug) {return;}
    addGenericDrug({
      name: drug.name,
      genericDrugCode: drug.code,
      unitPrice: drug.averagePrice ?? 0,
    });
    const count = useCartStore.getState().totalItems;
    notifications.show({
      position: 'bottom-right',
      title: 'Added to cart',
      message: `${count} item${count === 1 ? '' : 's'} in cart — ${drug.name} (generic)`,
      color: 'green',
      icon: <ShoppingCart size={18} />,
    });
  }

  function addBrand(id: string, name: string, price?: number | null) {
    addItem(id, 1, { name, unitPrice: price != null ? Number(price) : undefined });
    const count = useCartStore.getState().totalItems;
    notifications.show({
      position: 'bottom-right',
      title: 'Added to cart',
      message: `${count} item${count === 1 ? '' : 's'} in cart — ${name}`,
      color: 'green',
      icon: <ShoppingCart size={18} />,
    });
  }

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Button
            variant="subtle"
            color="green"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate({ to: '/shop/medicines' })}
            style={{ alignSelf: 'flex-start' }}
          >
            Back to Medicines
          </Button>

          {isLoading || !drug ? (
            <Card radius={20} withBorder padding="lg" style={{ borderColor: line }}>
              <Stack gap={6}>
                <Box style={{ height: 14, background: '#E8F0EC', borderRadius: 8, width: '50%' }} />
                <Box style={{ height: 20, background: '#E8F0EC', borderRadius: 8, width: '70%' }} />
                <Box style={{ height: 40, background: '#E8F0EC', borderRadius: 16, marginTop: 6 }} />
              </Stack>
            </Card>
          ) : (
            <>
              <Card radius={20} withBorder padding="lg" style={{ borderColor: line }}>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Title order={2} style={{ color: ink }}>
                        {drug.name}
                      </Title>
                      <Text size="sm" c={muted}>
                        {drug.code}
                      </Text>
                    </Box>
                    <Badge color="green" variant="light" radius="xl" size="sm">
                      Generic
                    </Badge>
                  </Group>

                  {(drug.genericClass || drug.pharmaceuticalClass || drug.source) && (
                    <Group gap="xs">
                      {drug.genericClass ? (
                        <Badge variant="light" radius="xl">
                          {drug.genericClass}
                        </Badge>
                      ) : null}
                      {drug.pharmaceuticalClass ? (
                        <Badge variant="light" radius="xl" color="teal">
                          {drug.pharmaceuticalClass}
                        </Badge>
                      ) : null}
                      {drug.source ? (
                        <Text size="xs" c={muted}>
                          source: {drug.source}
                        </Text>
                      ) : null}
                    </Group>
                  )}

                  <Divider />

                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Box>
                      <Text size="sm" c={muted}>
                        {drug.brandCount > 0
                          ? `Available across ${drug.brandCount} brand${drug.brandCount === 1 ? '' : 's'}`
                          : 'No brands listed yet'}
                      </Text>
                    </Box>
                    <Button
                      radius="xl"
                      style={{ background: green }}
                      styles={buttonStyles}
                      leftSection={<ShoppingCart size={16} />}
                      onClick={addGeneric}
                    >
                      Add Generic (any brand)
                    </Button>
                  </Group>
                </Stack>
              </Card>

              <Card radius={20} withBorder padding="lg" style={{ borderColor: line, background: '#F7FBF9' }}>
                <Stack gap={2}>
                  <Group justify="space-between" align="baseline" wrap="nowrap">
                    <Text fw={700} style={{ color: ink }}>
                      Average price
                    </Text>
                    {drug.averagePrice != null ? (
                      <Text size="xl" fw={900} style={{ color: green }}>
                        ₦{Number(drug.averagePrice).toLocaleString()}
                      </Text>
                    ) : (
                      <Text size="sm" c={muted}>
                        Price is set when a brand is dispensed
                      </Text>
                    )}
                  </Group>
                  <Text size="xs" c={muted} lh={1.6}>
                    This is the average of available brands. The actual price may be higher or
                    lower since it is a generic / non-specific brand — your pharmacist will
                    confirm before dispense.
                  </Text>
                </Stack>
              </Card>

              <Box>
                <Title order={3} style={{ color: ink }} mb="sm">
                  Similar Brands
                </Title>
                {drug.similarBrands.length === 0 ? (
                  <Text c={muted}>No brands are currently listed for this medicine.</Text>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {drug.similarBrands.map((b) => (
                      <Card key={b.id} radius={16} withBorder padding="sm" style={{ borderColor: line }}>
                        <Group gap="sm" wrap="nowrap" align="center">
                          <Image
                            src={b.imageUrl || undefined}
                            alt={b.name}
                            w={48}
                            h={48}
                            fit="contain"
                            style={{ borderRadius: 8, background: '#F1F8F4', border: `1px solid ${line}` }}
                          />
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={700} lineClamp={2}>
                              {b.name}
                            </Text>
                            <Text size="xs" c={muted}>
                              {b.code || 'No code'}
                            </Text>
                          </Stack>
                          <Stack gap={4} align="flex-end">
                            {b.unitPrice != null ? (
                              <Text size="sm" c={green} fw={800}>
                                ₦{Number(b.unitPrice).toLocaleString()}
                              </Text>
                            ) : (
                              <Text size="xs" c={muted}>
                                Price on order
                              </Text>
                            )}
                            <Button
                              size="xs"
                              radius="xl"
                              variant="light"
                              color="green"
                              leftSection={<ShoppingCart size={14} />}
                              onClick={() => addBrand(b.id, b.name, b.unitPrice)}
                            >
                              Add
                            </Button>
                          </Stack>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </>
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}