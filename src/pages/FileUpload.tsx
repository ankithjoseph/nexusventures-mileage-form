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
            <FileUploadForm onComplete={(rec) => { /* successful upload handler — avoid logging record to console */ }} />
          </div>
        </RequireAuth>
      </main>

      <Footer title="AML Compliance Form" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default FileUploadPage;
