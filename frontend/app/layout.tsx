import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../src/components/ThemeProvider";
import { AuthProvider } from "../src/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from '@/components/ui/use-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Budget App",
  description: "Track your finances with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
        >
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
