
'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, QrCode, Copy, User, Mail, Phone, Send, GraduationCap, BookOpen, Upload } from 'lucide-react';
import { Suspense } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Add a check for window to safely handle File object in Zod schema
const isBrowser = typeof window !== 'undefined';

const checkoutFormSchema = z.object({
  name: z.string().min(2, { message: 'Please enter a valid name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid 10-digit phone number.' }),
  role: z.enum(['Student', 'Practitioner', 'Faculty'], { required_error: 'Please select your role.' }),
  course: z.string().optional(),
  year: z.string().optional(),
  paymentScreenshot: isBrowser ? z.instanceof(FileList).refine(files => files.length === 1, 'Payment screenshot is required.') : z.any(),
}).refine(data => {
    if (data.role === 'Student' && !data.course) {
        return false;
    }
    return true;
}, {
    message: 'Please select your course.',
    path: ['course'],
}).refine(data => {
    if (data.role === 'Student' && !data.year) {
        return false;
    }
    return true;
}, {
    message: 'Please select your year.',
    path: ['year'],
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

function CheckoutContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  
  const [currentStep, setCurrentStep] = React.useState<'payment' | 'details'>('payment');
  const [isConfirming, setIsConfirming] = React.useState(false);

  const UPI_ID = 'iamsirenjeev@oksbi';
  const PAYEE_NAME = 'Focus CaseX';

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

  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${selectedPlanDetails.amount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });
  
  const watchedRole = form.watch('role');

  const onDetailsSubmit = (data: CheckoutFormValues) => {
    setIsConfirming(true);
    console.log("User Details and Screenshot:", data); // You can send this to a webhook
    toast({
        title: 'Submission Received!',
        description: 'Thank you. Our team will review your payment. You will receive a confirmation email once your subscription is activated.',
    });
     // Simulate processing and then redirect to homepage
    setTimeout(() => {
        router.push('/');
    }, 3000);
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast({
      title: 'UPI ID Copied!',
      description: `${UPI_ID} has been copied to your clipboard.`,
    });
  };
  
  return (
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
           <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>
          <Card className="shadow-2xl rounded-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold text-primary">Complete Your Purchase</CardTitle>
              <CardDescription className="text-lg pt-2">
                You're subscribing to the <span className="font-semibold text-foreground">{plan || 'N/A'}</span> plan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
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

              {currentStep === 'payment' && (
                <div className="border-t pt-6 space-y-6">
                  <p className="text-center font-semibold text-foreground">Step 1: Make Payment</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
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
                            src={qrCodeUrl}
                            width={200}
                            height={200}
                            alt={`QR code for payment of ${selectedPlanDetails.price} to ${PAYEE_NAME}`}
                            data-ai-hint="upi qr code"
                            className="rounded-lg shadow-md"
                            unoptimized // Important for external dynamic images
                        />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'details' && (
                 <Form {...form}>
                  <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-6 border-t pt-6">
                     <p className="text-center font-semibold text-foreground">Step 2: Submit Your Details</p>
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" />Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" />Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+91 98765 43210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Your Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your current role" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Student">Student</SelectItem><SelectItem value="Practitioner">Practitioner</SelectItem><SelectItem value="Faculty">Faculty / Educator</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                     {watchedRole === 'Student' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Course</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your course" /></SelectTrigger></FormControl><SelectContent><SelectItem value="BSc Optometry">BSc Optometry</SelectItem><SelectItem value="MSc Optometry">MSc Optometry</SelectItem><SelectItem value="PhD Optometry">PhD</SelectItem><SelectItem value="Diploma">Diploma in Optometry</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Year of Study</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your year" /></SelectTrigger></FormControl><SelectContent><SelectItem value="1st Year">1st Year</SelectItem><SelectItem value="2nd Year">2nd Year</SelectItem><SelectItem value="3rd Year">3rd Year</SelectItem><SelectItem value="4th Year">4th Year</SelectItem><SelectItem value="Intern">Intern</SelectItem><SelectItem value="Fellow">Fellow</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                     )}
                     <FormField
                        control={form.control}
                        name="paymentScreenshot"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Upload className="h-4 w-4" />Payment Screenshot</FormLabel>
                                <FormControl>
                                    <Input 
                                      type="file" 
                                      accept="image/*" 
                                      className="pt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                      onChange={(e) => field.onChange(e.target.files)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />

                    <Button type="submit" className="w-full" size="lg" disabled={isConfirming}>
                        {isConfirming ? 'Submitting...' : 'Complete Purchase'}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            
            <CardFooter>
                 {currentStep === 'payment' && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setCurrentStep('details')}
                    >
                      I've Paid, Fill Details
                    </Button>
                )}
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

    

