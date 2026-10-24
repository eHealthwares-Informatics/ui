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
import { useNavigate, useSearch } from '@tanstack/react-router';
import { CheckCircle2, Package, RefreshCw, ShoppingCart } from 'lucide-react';
import { parseOrderParam } from '../order-query';
import { websiteApi } from '../website/api';
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

function naira(amount: number) {
  return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PayReturnPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/shop/pay/return' }) as Record<string, string>;
  // Providers append their own query to our redirect URL (sometimes with a
  // second '?'), so the order param can arrive as "<id>?paymentReference=...".
  const parsedOrder = parseOrderParam(search.order);
  const orderId = parsedOrder.orderId;
  const reference =
    search.trxref || search.reference || search.paymentReference || parsedOrder.paymentReference;

  const {
    data: tx,
    isLoading: txLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['pay-return', reference],
    queryFn: async () => {
      // Storefront route — use the website client so an expired shopper session
      // never bounces to the admin /sign-in (ui#2).
      if (!reference) {
        throw new Error('Missing payment reference');
      }
      return websiteApi.verifyPayment(reference);
    },
    enabled: !!reference,
    retry: 2,
    refetchInterval: (query) => {
      if (query.state.data?.paid) {
        return false;
      }
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
                  Your order has been confirmed and is being processed. You will receive tracking
                  updates via SMS and WhatsApp.
                </Text>
                <Group gap="sm">
                  {orderId && (
                    <Button
                      radius="xl"
                      color="green"
                      styles={buttonStyles}
                      style={{ background: green }}
                      leftSection={<Package size={18} />}
                      onClick={() =>
                        navigate({
                          to: '/shop/orders/$id',
                          params: { id: orderId },
                          search: (reference ? { paymentReference: reference } : {}) as any,
                        })
                      }
                    >
                      Track Order
                    </Button>
                  )}
                  {reference && (
                    <Button
                      radius="xl"
                      variant="light"
                      color="green"
                      leftSection={<RefreshCw size={18} />}
                      loading={isFetching}
                      onClick={() => void refetch()}
                      data-testid="pay-return-confirm"
                    >
                      Confirm payment status
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
                <Group gap="sm">
                  {orderId && (
                    <Button
                      radius="xl"
                      variant="light"
                      color="green"
                      onClick={() =>
                        navigate({
                          to: '/shop/orders/$id',
                          params: { id: orderId },
                          search: (reference ? { paymentReference: reference } : {}) as any,
                        })
                      }
                    >
                      View Order
                    </Button>
                  )}
                  {reference && (
                    <Button
                      radius="xl"
                      variant="light"
                      color="green"
                      leftSection={<RefreshCw size={18} />}
                      loading={isFetching}
                      onClick={() => void refetch()}
                      data-testid="pay-return-confirm"
                    >
                      Confirm payment status
                    </Button>
                  )}
                </Group>
              </>
            )}
          </Stack>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
