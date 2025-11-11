import React from 'react';
import RequireAuth from '@/components/RequireAuth';
import FileUploadForm from '@/components/FileUploadForm';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

const FileUploadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <RequireAuth>
          <div>
            <h1 className="text-2xl font-semibold mb-4">AML Compliance Form</h1>
            <p className="text-sm text-muted-foreground mb-4">Provide the information and required documents for AML compliance.</p>
            <FileUploadForm onComplete={(rec) => console.log('Uploaded record', rec)} />
          </div>
        </RequireAuth>
      </main>

      <Footer title="Ireland Tax Year 2024" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default FileUploadPage;
