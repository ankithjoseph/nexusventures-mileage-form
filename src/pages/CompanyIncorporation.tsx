import React from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import CompanyIncorporationForm from '@/components/CompanyIncorporationForm';

const CompanyIncorporation = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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

            <CompanyIncorporationForm />
          </div>
        </Card>
      </main>

      <Footer title="Company Incorporation" subtitle="We will contact you to complete incorporation and payment." />
    </div>
  );
};

export default CompanyIncorporation;
