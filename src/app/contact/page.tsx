
'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ContactUsForm } from '@/components/contact-us-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ContactSalesPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <Card className="shadow-2xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">Contact Sales</CardTitle>
              <CardDescription className="text-lg pt-2">
                We're excited to partner with your institution. Please fill out the form below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactUsForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
