
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardClientLayout from './client-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Loading...</p>
      </div>
    }>
      <DashboardClientLayout>
        {children}
      </DashboardClientLayout>
    </Suspense>
  );
}
