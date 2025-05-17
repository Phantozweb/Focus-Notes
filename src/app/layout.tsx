import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a professional sans-serif font
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { Providers } from './providers';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans', // Using geist-sans variable for inter to keep shadcn happy
});


export const metadata: Metadata = {
  title: 'FocusCase AI',
  description: 'Log optometry cases, analyze with AI, and gain insights.',
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
