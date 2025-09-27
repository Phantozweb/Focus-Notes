
'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, QrCode, Copy } from 'lucide-react';
import { Suspense } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

function CheckoutContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [isConfirming, setIsConfirming] = React.useState(false);
  const UPI_ID = 'iamsirenjeev@oksbi';

  const planDetails: { [key: string]: { price: string, description: string, amount: number } } = {
    'Monthly': { price: '₹300', description: 'Billed monthly', amount: 300 },
    '3 Months': { price: '₹750', description: 'Billed quarterly', amount: 750 },
    '6 Months': { price: '₹1200', description: 'Billed semi-annually', amount: 1200 },
    'Yearly': { price: '₹2400', description: 'Billed annually', amount: 2400 },
  };

  const selectedPlanDetails = plan && planDetails[plan] ? planDetails[plan] : {
    price: 'N/A',
    description: 'No plan selected. Please go back and choose a plan.',
    amount: 0,
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast({
      title: 'UPI ID Copied!',
      description: `${UPI_ID} has been copied to your clipboard.`,
    });
  };

  const handleConfirmation = () => {
    setIsConfirming(true);
    toast({
        title: 'Payment Confirmation Pending',
        description: 'We are verifying your payment. Please wait a moment...',
    });
    // Simulate payment verification and then redirect
    setTimeout(() => {
        toast({
            title: 'Payment Successful!',
            description: 'Your subscription is now active. Welcome to Focus CaseX!',
        });
        router.push('/cases'); // Redirect to cases page on successful "payment"
    }, 2500);
  };
  
  return (
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
           <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>
          <Card className="shadow-2xl rounded-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold text-primary">Complete Your Payment</CardTitle>
              <CardDescription className="text-lg pt-2">
                You're subscribing to the <span className="font-semibold text-foreground">{plan || 'N/A'}</span> plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {plan ? (
                <>
                  <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-primary" />
                        <div>
                            <p className="font-semibold">{plan} Plan</p>
                            <p className="text-sm text-muted-foreground">{selectedPlanDetails.description}</p>
                        </div>
                    </div>
                    <p className="text-xl font-bold">{selectedPlanDetails.price}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4">
                    <div className="space-y-4 text-center md:text-left">
                        <h3 className="font-semibold text-lg">Pay using UPI</h3>
                        <p className="text-muted-foreground text-sm">Scan the QR code with your favorite UPI app or copy the UPI ID below.</p>
                        <div className="flex items-center gap-2 p-3 rounded-md bg-muted justify-center md:justify-start">
                            <span className="font-mono text-foreground">{UPI_ID}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopyUpiId}><Copy className="h-4 w-4" /><span className="sr-only">Copy UPI ID</span></Button>
                        </div>
                         <p className="text-sm">Amount to Pay: <span className="font-bold text-primary">{selectedPlanDetails.price}</span></p>
                    </div>
                    <div className="flex justify-center">
                        <Image
                            src="https://placehold.co/200x200.png"
                            width={200}
                            height={200}
                            alt="UPI QR Code"
                            data-ai-hint="upi qr code"
                            className="rounded-lg shadow-md"
                        />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-destructive">No plan selected. Please go back to the pricing page and choose a plan to continue.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                disabled={!plan || isConfirming}
                onClick={handleConfirmation}
              >
                {isConfirming ? 'Confirming Payment...' : "I've Paid, Complete Purchase"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
  );
}


export default function CheckoutPage() {
    return (
        <MainLayout>
            <Suspense fallback={<div>Loading...</div>}>
                <CheckoutContent />
            </Suspense>
        </MainLayout>
    );
}

