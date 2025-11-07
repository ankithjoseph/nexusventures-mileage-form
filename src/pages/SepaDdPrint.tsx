import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import nexusLogo from '@/assets/nexus-ventures-logo.png';

type SepaData = {
  uniqueMandateRef?: string;
  name?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  iban?: string;
  bic?: string;
  creditor?: string;
  mandateRef?: string;
  paymentType?: string;
  signatureDate?: string;
};

const defaultData: SepaData = {
  creditor: 'IE75ZZZ362238',
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
    <div className="p-4 bg-white text-black" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', border: '1px solid #000', padding: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', background: '#e9e1c7', padding: 10, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #999', padding: '6px 8px', background: '#fff' }}>*Unique Mandate Reference</div>
          </div>
          <div style={{ width: 160, textAlign: 'right' }}>
            <img src={nexusLogo} alt="Nexus" style={{ height: 54 }} />
          </div>
        </div>

        {/* Creditor identifier */}
        <div style={{ padding: '10px 12px', background: '#fff' }}>
          <div style={{ fontWeight: 700 }}>*Creditor Identifier: {data.creditor}</div>
        </div>

        {/* Legal text */}
        <div style={{ padding: '8px 12px', fontSize: 12 }}>
          <div style={{ border: '1px solid #ddd', padding: 8 }}>
            Legal Text: By signing this mandate form, you authorise (A) Nexus Ventures Ltd to send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Nexus Ventures Ltd.
          </div>
        </div>

        {/* Main blue form area */}
        <div style={{ background: '#d9ecf8', padding: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ marginBottom: 6, fontWeight: 700 }}>*Customer Name :</div>
            <div style={{ borderBottom: '1px solid #000', height: 26 }}>{data.name || ' '}</div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ marginBottom: 6 }}>Customer Address:</div>
            <div style={{ borderBottom: '1px solid #000', height: 18 }}>{data.address || ' '}</div>
            <div style={{ borderBottom: '1px solid #000', height: 18, marginTop: 4 }}>{''}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>*City/postcode:</div>
              <div style={{ borderBottom: '1px solid #000', height: 22 }}>{(data.city || '') + ' ' + (data.postcode || '')}</div>
            </div>
            <div style={{ width: 160 }}>
              <div style={{ fontSize: 12 }}>*Country:</div>
              <div style={{ borderBottom: '1px solid #000', height: 22 }}>{data.country || ''}</div>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}>*Account number (IBAN) :</div>
                <div style={{ borderBottom: '1px solid #000', height: 22 }}>{data.iban || ''}</div>
              </div>
              <div style={{ width: 220 }}>
                <div style={{ fontSize: 12 }}>*Swift BIC :</div>
                <div style={{ borderBottom: '1px solid #000', height: 22 }}>{data.bic || ''}</div>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #000', padding: 8, background: '#fff', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>*Creditors Name :</div>
            <div style={{ fontSize: 12 }}>*Creditors : Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin. D04F1P2</div>
            <div style={{ fontSize: 12 }}>*Country : Republic of Ireland</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, border: '1px solid #000', borderRadius: '50%' }} />
                <div style={{ fontSize: 12 }}>Type of payment Recurrent :</div>
              </div>
              <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, border: '1px solid #000', borderRadius: '50%' }} />
                <div style={{ fontSize: 12 }}>or One-Off Payment :</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>*Date of signing :</div>
              <div style={{ borderBottom: '1px solid #000', height: 22 }}>{data.signatureDate || ''}</div>
            </div>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 12 }}>*Signature(s) :</div>
              <div style={{ border: '1px solid #000', height: 64 }} />
            </div>
          </div>
        </div>

        <div style={{ padding: 8, fontSize: 10 }}>
          <em>Please complete all the fields below marked *</em>
        </div>

        <div style={{ padding: 10 }}>
          <Button onClick={handlePrint}>Print</Button>
        </div>
      </div>

      <style>{`@media print { body { background: white; } button { display: none !important; } .shadow-sm { box-shadow: none !important; } }`}</style>
    </div>
  );
};

export default SepaDdPrint;
