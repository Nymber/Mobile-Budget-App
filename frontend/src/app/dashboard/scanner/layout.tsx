import { AuthProvider } from '@/services/AuthContext';

export default function ScannerLayout({
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
