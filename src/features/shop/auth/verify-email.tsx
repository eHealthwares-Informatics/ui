import { Button, Center, Container, Loader, Paper, Text, ThemeIcon, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { Check, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { websiteApi } from '../website/api';
import { WebsiteLayout, green, ink, muted, line, buttonStyles } from '../website/layout';

type State = 'verifying' | 'verified' | 'error';

export default function VerifyEmailPage({ token }: { token: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    websiteApi
      .verifyEmail({ token })
      .then(() => active && setState('verified'))
      .catch((err) => {
        if (!active) return;
        setState('error');
        setMessage(getApiErrorMessage(err) || 'Could not verify your email.');
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <WebsiteLayout>
      <Container size="sm" py={80}>
        <Paper radius={30} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
          {state === 'verifying' ? (
            <>
              <Center>
                <Loader color="green" />
              </Center>
              <Title order={3} className="damorex-heading" mt="md">
                Verifying your email…
              </Title>
            </>
          ) : (
            <>
              <ThemeIcon
                radius="xl"
                size={64}
                color={state === 'verified' ? 'green' : 'red'}
                mx="auto"
              >
                {state === 'verified' ? <Check size={32} /> : <AlertCircle size={32} />}
              </ThemeIcon>
              <Title order={2} className="damorex-heading" mt="md">
                {state === 'verified' ? 'Email Verified' : 'Verification Failed'}
              </Title>
              <Text c={muted} lh={1.7} mt="sm">
                {state === 'verified' ? 'Thanks! Your email address is now confirmed.' : message}
              </Text>
              <Button
                radius="xl"
                mt="lg"
                styles={buttonStyles}
                style={{ background: green }}
                onClick={() => navigate({ to: '/shop' })}
              >
                Continue Shopping
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </WebsiteLayout>
  );
}
