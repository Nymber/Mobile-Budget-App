import { AuthProvider } from '@/services/AuthContext';

export default function EarningsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
