'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // Though Textarea is used mostly
import { Eye, Glasses, ShieldCheck, FileText, Save } from 'lucide-react';
import type { OptometryCase } from '@/types/case';

const caseFormSchema = z.object({
  visualAcuity: z.string().min(1, { message: 'Visual acuity is required.' }),
  refraction: z.string().min(1, { message: 'Refraction details are required.' }),
  ocularHealthStatus: z.string().min(1, { message: 'Ocular health status is required.' }),
  additionalNotes: z.string().optional(),
});

type CaseFormValues = z.infer<typeof caseFormSchema>;

interface CaseFormProps {
  onSubmit: (data: CaseFormValues) => void;
  onCancel: () => void;
  defaultValues?: Partial<OptometryCase>; // For editing, though not explicitly requested
  isLoading?: boolean;
}

export function CaseForm({ onSubmit, onCancel, defaultValues, isLoading }: CaseFormProps) {
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      visualAcuity: defaultValues?.visualAcuity || '',
      refraction: defaultValues?.refraction || '',
      ocularHealthStatus: defaultValues?.ocularHealthStatus || '',
      additionalNotes: defaultValues?.additionalNotes || '',
    },
  });

  const handleFormSubmit = (data: CaseFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="visualAcuity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Visual Acuity</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., OD: 20/20, OS: 20/25"
                  {...field}
                  className="min-h-[80px]"
                  aria-describedby="visualAcuity-message"
                />
              </FormControl>
              <FormMessage id="visualAcuity-message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="refraction"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Glasses className="h-5 w-5 text-primary" />Refraction</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., OD: -1.00 -0.50 x 180, OS: -1.25 SPH"
                  {...field}
                  className="min-h-[80px]"
                  aria-describedby="refraction-message"
                />
              </FormControl>
              <FormMessage id="refraction-message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ocularHealthStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Ocular Health Status</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Anterior segment WNL, Posterior segment WNL, IOPs normal"
                  {...field}
                  className="min-h-[100px]"
                  aria-describedby="ocularHealthStatus-message"
                />
              </FormControl>
              <FormMessage id="ocularHealthStatus-message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any other relevant information"
                  {...field}
                  className="min-h-[100px]"
                  aria-describedby="additionalNotes-message"
                />
              </FormControl>
              <FormMessage id="additionalNotes-message" />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Case'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
