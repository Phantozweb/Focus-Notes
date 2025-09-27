import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'Focus CaseX | AI-Powered Optometry Case Platform',
  description: 'The leading AI-powered platform for optometry students and professionals. Streamline case logging, get instant analysis, and accelerate clinical education with our secure, offline-first software.',
  keywords: ['optometry software', 'optometry case management', 'AI optometry', 'clinical education tool', 'optometry student tool', 'case analysis', 'patient case log'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
