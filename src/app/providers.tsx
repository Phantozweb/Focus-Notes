'use client'

import type React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // If you were to use next-themes:
  // import { ThemeProvider } from 'next-themes'
  // return <ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>
  return <>{children}</>
}
