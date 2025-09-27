
'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const planDetails: { [key: string]: { price: string, description: string } } = {
    'Monthly': { price: '₹300', description: 'Billed monthly' },
    '3 Months': { price: '₹750', description: 'Billed quarterly' },
    '6 Months': { price: '₹1200', description: 'Billed semi-annually' },
    'Yearly': { price: '₹2400', description: 'Billed annually' },
  };

  const selectedPlanDetails = plan && planDetails[plan] ? planDetails[plan] : {
    price: 'N/A',
    description: 'No plan selected. Please go back and choose a plan.'
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
        router.push('/cases'); // Redirect to cases page on successful "payment"
    }, 2000);
  };
  
  return (
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
           <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>
          <Card className="shadow-2xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">Checkout</CardTitle>
              <CardDescription className="text-lg pt-2">
                You are purchasing the <span className="font-semibold text-foreground">{plan || 'N/A'}</span> plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plan ? (
                <div className="space-y-4">
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
                   <p className="text-xs text-center text-muted-foreground pt-2">
                    This is a placeholder checkout page. No real payment will be processed.
                  </p>
                </div>
              ) : (
                <p className="text-center text-destructive">No plan selected. Please go back to the pricing page and choose a plan to continue.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                disabled={!plan || isProcessing}
                onClick={handlePayment}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {isProcessing ? 'Processing...' : 'Pay Now'}
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

