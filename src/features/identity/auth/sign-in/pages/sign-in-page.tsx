import { useSearch } from '@tanstack/react-router';
import { RxSignIn } from '@/features/rxsoft/pages';

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' });

  return <RxSignIn redirectTo={redirect} />;
}
