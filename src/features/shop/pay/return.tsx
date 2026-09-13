import {
  Box,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { WebsiteLayout, green, darkGreen, ink, muted, line, soft, buttonStyles } from '../website/layout';
import { rxsoftApi } from '@/lib/rxsoft-api';

function naira(amount: number) {
  return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PayReturnPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/shop/pay/return' }) as Record<string, string>;
  const orderId = search.order;
  const reference = search.trxref || search.reference;

  const { data: tx, isLoading: txLoading } = useQuery({
    queryKey: ['pay-return', reference],
    queryFn: async () => {
      const { data } = await rxsoftApi.get(`/payments/verify/${reference}`);
      return data as { reference: string; status: string; amountPaid: number; provider: string; paid: boolean };
    },
    enabled: !!reference,
    retry: 2,
    refetchInterval: (query) => {
      if (query.state.data?.paid) return false;
      return 3000;
    },
  });

  const paid = tx?.paid ?? false;

  return (
    <WebsiteLayout>
      <Box bg="#FFFFFF">
        <Container size="sm" py={70}>
          <Stack gap="lg" align="center">
            {txLoading ? (
              <Group justify="center" py={40}>
                <Loader size="sm" />
                <Text c={muted}>Verifying payment...</Text>
              </Group>
            ) : paid ? (
              <>
                <ThemeIcon radius="xl" size={72} color="green" style={{ background: green }}>
                  <CheckCircle2 size={36} />
                </ThemeIcon>
                <Title order={2} className="damorex-heading" style={{ color: ink }}>
                  Payment Successful
                </Title>
                <Paper
                  radius={16}
                  p="md"
                  withBorder
                  style={{ borderColor: line, background: soft, textAlign: 'center' }}
                >
                  <Stack gap={4} align="center">
                    <Text size="xs" c={muted} tt="uppercase" fw={700}>
                      Amount Paid
                    </Text>
                    <Text fw={950} size="xl" style={{ color: darkGreen, letterSpacing: '0.02em' }}>
                      {naira(tx?.amountPaid ?? 0)}
                    </Text>
                    {reference && (
                      <Text size="xs" c={muted}>
                        Ref: {reference}
                      </Text>
                    )}
                  </Stack>
                </Paper>
                <Text c={muted} lh={1.7} ta="center" maw={380}>
                  Your order has been confirmed and is being processed.
                  You will receive tracking updates via SMS and WhatsApp.
                </Text>
                <Group gap="sm">
                  {orderId && (
                    <Button
                      radius="xl"
                      color="green"
                      styles={buttonStyles}
                      style={{ background: green }}
                      leftSection={<Package size={18} />}
                      onClick={() => navigate({ to: '/shop/orders/$id', params: { id: orderId } })}
                    >
                      Track Order
                    </Button>
                  )}
                  <Button
                    radius="xl"
                    variant="light"
                    color="green"
                    leftSection={<ShoppingCart size={18} />}
                    onClick={() => navigate({ to: '/shop/shop' })}
                  >
                    Continue Shopping
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <ThemeIcon radius="xl" size={72} color="yellow" variant="light">
                  <Package size={36} />
                </ThemeIcon>
                <Title order={2} className="damorex-heading" style={{ color: ink }}>
                  Processing Payment
                </Title>
                <Text c={muted} lh={1.7} ta="center" maw={380}>
                  We are confirming your payment. This usually takes a few seconds.
                  {reference && (
                    <>
                      <br />
                      Reference: {reference}
                    </>
                  )}
                </Text>
                <Loader size="sm" />
                {orderId && (
                  <Button
                    radius="xl"
                    variant="light"
                    color="green"
                    onClick={() => navigate({ to: '/shop/orders/$id', params: { id: orderId } })}
                  >
                    View Order
                  </Button>
                )}
              </>
            )}
          </Stack>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
