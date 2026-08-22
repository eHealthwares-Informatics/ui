import { Button } from '@mantine/core';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useAuthStore } from '@/stores/auth-store';

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

export function SignOutDialog({ open, onOpenChange, ...props }: SignOutDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const logoutAll = useAuthStore((state) => state.logoutAll);

  const redirectToSignIn = () => {
    const currentPath = location.href;
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    });
  };

  const handleSignOut = () => {
    logout();
    redirectToSignIn();
  };

  const handleSignOutAll = async () => {
    await logoutAll();
    redirectToSignIn();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out"
      desc="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign out"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
      {...props}
    >
      <Button variant="subtle" color="red" size="sm" fullWidth onClick={handleSignOutAll}>
        Sign out of all devices
      </Button>
    </ConfirmDialog>
  );
}