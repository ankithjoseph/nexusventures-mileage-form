import React from 'react';
import RequireAuth from '@/components/RequireAuth';
import CompanyIncorporationForm from '@/components/CompanyIncorporationForm';
import PageMeta from '@/components/PageMeta';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

const CompanyIncorporation = () => {
  return (
    <PageMeta title="Company Incorporation" ogTitle="Company Incorporation - Nexus Ventures" description="Submit details to incorporate a new company." image="/logo.png" canonical="https://www.nexusventures.eu/company-incorporation">
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-7xl flex-1">
          <RequireAuth>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Company Incorporation</h1>
                <p className="text-sm text-muted-foreground mb-6">Provide details required for company constitution. All fields marked required must be completed.</p>
              </div>

              <CompanyIncorporationForm />
            </div>
          </RequireAuth>
        </main>

        <Footer title="Company Incorporation" subtitle="We will contact you to complete incorporation and payment." />
      </div>
    </PageMeta>
  );
};

export default CompanyIncorporation;
