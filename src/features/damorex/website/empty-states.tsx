import { Container, Stack, Text, Title, ThemeIcon, Button, Group } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  Pill,
  SearchX,
  Package,
  FileUp,
  ShoppingCart,
  Heart,
  CalendarClock,
  Gift,
  FileText,
  FolderOpen,
  Stethoscope,
} from 'lucide-react';
import { green, muted } from './components';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

function EmptyStateWrapper({
  icon,
  title,
  message,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  actions?: React.ReactNode;
}) {
  return (
    <Container size="xs" py={80}>
      <Stack align="center" gap="lg" style={{ textAlign: 'center' }}>
        <ThemeIcon radius="xl" size={80} color="green" variant="light">
          {icon}
        </ThemeIcon>
        <Stack gap={8}>
          <Title order={3} className="damorex-heading" style={{ color: '#0F172A' }}>
            {title}
          </Title>
          <Text c={muted} size="md" lh={1.7}>
            {message}
          </Text>
        </Stack>
        {actions ? (
          <Group gap="sm" mt="xs">
            {actions}
          </Group>
        ) : null}
      </Stack>
    </Container>
  );
}

export function EmptyProducts({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<Pill size={36} />}
      title={title ?? 'No medicines found'}
      message={
        message ??
        "We couldn't find any medicines matching your criteria. Try a different category or search term."
      }
      actions={
        <>
          <Button
            radius="xl"
            style={{ background: green }}
            onClick={() => navigate({ to: '/shop/shop' })}
          >
            Browse Catalog
          </Button>
          <Button
            radius="xl"
            variant="outline"
            color="gray"
            onClick={() => navigate({ to: '/shop/search' })}
          >
            Search
          </Button>
        </>
      }
    />
  );
}

export function EmptySearchResults({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<SearchX size={36} />}
      title={title ?? 'No results found'}
      message={
        message ??
        "We couldn't find any matches for your search. Try different keywords or browse our categories."
      }
      actions={
        <>
          <Button
            radius="xl"
            variant="outline"
            color="gray"
            onClick={() => navigate({ to: '/shop/search' })}
          >
            Try Again
          </Button>
          <Button
            radius="xl"
            style={{ background: green }}
            onClick={() => navigate({ to: '/shop/shop' })}
          >
            Browse Categories
          </Button>
        </>
      }
    />
  );
}

export function EmptyOrders({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<Package size={36} />}
      title={title ?? 'No orders yet'}
      message={
        message ??
        "You haven't placed any orders yet. Start shopping and your order history will appear here."
      }
      actions={
        <Button
          radius="xl"
          style={{ background: green }}
          onClick={() => navigate({ to: '/shop/shop' })}
        >
          Start Shopping
        </Button>
      }
    />
  );
}

export function EmptyPrescriptions({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<FileUp size={36} />}
      title={title ?? 'No prescriptions uploaded'}
      message={
        message ??
        "You haven't uploaded any prescriptions yet. Upload your doctor's prescription and our pharmacists will review it."
      }
      actions={
        <Button
          radius="xl"
          style={{ background: green }}
          onClick={() => navigate({ to: '/shop/upload-prescription' })}
        >
          Upload Prescription
        </Button>
      }
    />
  );
}

export function EmptyCart({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<ShoppingCart size={36} />}
      title={title ?? 'Your cart is empty'}
      message={
        message ?? 'Your shopping cart is empty. Browse our medicines and add items to get started.'
      }
      actions={
        <Button
          radius="xl"
          style={{ background: green }}
          onClick={() => navigate({ to: '/shop/shop' })}
        >
          Browse Medicines
        </Button>
      }
    />
  );
}

export function EmptySavedMedicines({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<Heart size={36} />}
      title={title ?? 'No saved medicines'}
      message={
        message ??
        "You haven't saved any medicines yet. Browse and save your favourite medicines for quick access."
      }
      actions={
        <Button
          radius="xl"
          style={{ background: green }}
          onClick={() => navigate({ to: '/shop/shop' })}
        >
          Browse & Save
        </Button>
      }
    />
  );
}

export function EmptyConsultations({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<CalendarClock size={36} />}
      title={title ?? 'No consultations booked'}
      message={
        message ??
        "You haven't booked any consultations yet. Speak with a licensed pharmacist from the comfort of your home."
      }
      actions={
        <Button
          radius="xl"
          style={{ background: green }}
          onClick={() => navigate({ to: '/shop/consult-pharmacist' })}
        >
          Book a Consultation
        </Button>
      }
    />
  );
}

export function EmptyRewards({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<Gift size={36} />}
      title={title ?? 'No reward activity yet'}
      message={
        message ??
        "You don't have any reward activity yet. Earn points with every purchase and redeem them on future orders."
      }
      actions={
        <Button
          radius="xl"
          variant="outline"
          color="green"
          onClick={() => navigate({ to: '/shop/shop' })}
        >
          Learn About Rewards
        </Button>
      }
    />
  );
}

export function EmptyBlog({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<FileText size={36} />}
      title={title ?? 'No articles yet'}
      message={
        message ??
        "We haven't published any articles yet. Check back later for health tips, medication guides, and wellness advice."
      }
      actions={
        <Button
          radius="xl"
          variant="outline"
          color="gray"
          onClick={() => navigate({ to: '/shop/blog' })}
        >
          Check Back Later
        </Button>
      }
    />
  );
}

export function EmptyCategories({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<FolderOpen size={36} />}
      title={title ?? 'No categories found'}
      message={
        message ?? "We couldn't find any categories matching your search. Try different keywords."
      }
      actions={
        <Button
          radius="xl"
          style={{ background: green }}
          onClick={() => navigate({ to: '/shop/shop' })}
        >
          Browse All
        </Button>
      }
    />
  );
}

export function EmptyHealthConcerns({ title, message }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyStateWrapper
      icon={<Stethoscope size={36} />}
      title={title ?? 'No health concerns listed'}
      message={
        message ??
        "We couldn't find any health concerns matching your search. Try different keywords or browse our medicine catalog."
      }
      actions={
        <Button
          radius="xl"
          style={{ background: green }}
          onClick={() => navigate({ to: '/shop/health-concerns' })}
        >
          Browse All
        </Button>
      }
    />
  );
}
