import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type SepaData = {
  name?: string;
  address?: string;
  iban?: string;
  bic?: string;
  creditor?: string;
  mandateRef?: string;
  signatureDate?: string;
};

const defaultData: SepaData = {
  creditor: 'Nexus Ventures',
};

const SepaDdPrint: React.FC = () => {
  const [data, setData] = useState<SepaData>(defaultData);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sepa_dd_print');
      if (raw) {
        const parsed = JSON.parse(raw);
        setData((prev) => ({ ...prev, ...(parsed || {}) }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 bg-white text-black" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-3xl mx-auto border border-gray-200 p-6 shadow-sm bg-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold">SEPA Direct Debit Mandate</h2>
            <div className="text-sm text-muted-foreground">Creditor Identifier: {data.creditor}</div>
          </div>
          <div className="text-right text-sm">
            <div>Mandate reference</div>
            <div className="font-semibold mt-1">{data.mandateRef || '____________________'}</div>
          </div>
        </div>

        <section className="mb-4">
          <div className="text-sm mb-2">Creditor:</div>
          <div className="font-medium">{data.creditor}</div>
        </section>

        <section className="mb-6">
          <div className="text-sm mb-2">Debtor / Account holder</div>
          <div className="mb-1">Name: <span className="font-medium">{data.name || '____________________'}</span></div>
          <div className="mb-1">Address: <span className="font-medium">{data.address || '____________________'}</span></div>
          <div className="mb-1">IBAN: <span className="font-medium">{data.iban || '____________________'}</span></div>
          <div className="mb-1">BIC: <span className="font-medium">{data.bic || '____________________'}</span></div>
        </section>

        <section className="mb-6 text-sm">
          <div className="font-semibold mb-2">Authorization</div>
          <div className="mb-2">By signing this mandate form, you authorize the creditor to send instructions to your bank to debit your account and your bank to debit your account in accordance with the instructions from the creditor.</div>
          <div>This mandate is created in accordance with the SEPA Core Direct Debit scheme.</div>
        </section>

        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm mb-1">Place / Date</div>
              <div className="font-medium">{data.signatureDate || '____________________'}</div>
            </div>
            <div>
              <div className="text-sm mb-1">Signature of the account holder</div>
              <div className="mt-8 border-b border-gray-300" style={{ height: 1 }} />
            </div>
          </div>
        </section>

        <div className="text-xs text-muted-foreground">
          Please return this signed mandate to the creditor. The creditor will keep this mandate as proof of your authorization.
        </div>

        <div className="mt-6 flex space-x-2">
          <Button onClick={handlePrint}>Print</Button>
        </div>
      </div>

      <style>{`@media print { body { background: white; } button { display: none !important; } .shadow-sm { box-shadow: none !important; } }`}</style>
    </div>
  );
};

export default SepaDdPrint;
