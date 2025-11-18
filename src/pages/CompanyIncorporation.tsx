import React from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import CompanyIncorporationForm from '@/components/CompanyIncorporationForm';
import { generateCompanyIncorporationPDF } from '@/utils/pdfGenerator';
import type { CompanyIncorporationData } from '@/components/CompanyIncorporationForm';
import { toast } from '@/components/ui/use-toast';

const CompanyIncorporation = () => {
  const handleSubmit = async (data: CompanyIncorporationData) => {
    try {
      const doc = generateCompanyIncorporationPDF(data);
      const pdfBlob = doc.output('blob');

      const base64PDF: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = () => {
          try {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
      });

      const payload = {
        name: data.applicant.fullName || 'Unknown',
        email: data.applicant.email,
        pps: '',
        pdfData: base64PDF,
        type: 'company-incorporation',
      };

      const resp = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({} as any));
        throw new Error(errJson?.error || 'Unable to send incorporation form');
      } else {
        toast({ title: 'Form submitted', description: 'Your incorporation form was emailed. You will also receive a copy.' });
      }

    } catch (e) {
      console.error('Company incorporation submission failed:', e);
      const msg = e instanceof Error ? e.message : 'Unable to submit incorporation form';
      toast({ title: 'Submit error', description: msg, variant: 'destructive' });
    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`@media print { .no-print { display:none !important; } .signature-preview img { width: 80mm !important; height: auto !important; } } .signature-preview img { image-rendering: -webkit-optimize-contrast; }`}</style>
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Company Incorporation</h1>
              <p className="text-sm text-muted-foreground">
                Provide details required for company constitution. All fields marked required must be completed.
              </p>
            </div>

            <CompanyIncorporationForm onSubmit={handleSubmit} />
          </div>
        </Card>
      </main>

      <Footer title="Company Incorporation" subtitle="" />
    </div>
  );
};

export default CompanyIncorporation;
