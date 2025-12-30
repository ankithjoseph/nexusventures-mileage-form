import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateSepaPDF } from '@/utils/pdfGenerator';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
import { Button } from '@/components/ui/button';
import ThankYouDialog from '@/components/ThankYouDialog';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import FormActions from '@/components/FormActions';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Basic IBAN validation (checksum mod-97). Keeps logic local to avoid new deps.
function validateIBAN(iban: string): boolean {
  const trimmed = iban.replace(/\s+/g, '').toUpperCase();
  if (trimmed.length < 15) return false;
  // Move first 4 chars to the end
  const rearr = trimmed.slice(4) + trimmed.slice(0, 4);
  // Replace letters with numbers (A=10 ... Z=35)
  let numeric = '';
  for (const ch of rearr) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      numeric += ch;
    } else if (code >= 65 && code <= 90) {
      numeric += (code - 55).toString();
    } else {
      return false;
    }
  }

  // Compute mod 97 iteratively to avoid bigint issues
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const block = remainder.toString() + numeric.substring(i, i + 7);
    remainder = parseInt(block, 10) % 97;
  }
  return remainder === 1;
}

function validateBIC(bic: string): boolean {
  if (!bic) return false;
  const trimmed = bic.replace(/\s+/g, '').toUpperCase();
  // BIC is 8 or 11 characters: 4 letters (bank) + 2 letters (country) + 2 alnum (location) + optional 3 alnum (branch)
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(trimmed);
}

const SepaDd: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [creditor] = useState('Nexus Ventures');
  const [paymentType, setPaymentType] = useState<'recurrent' | 'one-off' | ''>('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const sigPadRef = useRef<SignaturePadHandle | null>(null);
  const [signatureDate, setSignatureDate] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const buildPdf = () =>
    generateSepaPDF({
      name,
      address,
      city,
      postcode,
      country,
      iban,
      bic,
      creditor,
      paymentType,
      signatureDate,
      signatureData: signatureData ?? sigPadRef.current?.getDataUrl(1.5) ?? null,
    });

  const downloadPdf = () => {
    // Validate details before generating a PDF for download
    if (!validateForPdf()) return;

    try {
      const doc = buildPdf();
      const date = new Date().toISOString().split('T')[0];
      doc.save(`sepa-mandate-${date}.pdf`);
    } catch (err) {
      console.error('Error generating PDF for download', err);
      toast({ title: 'PDF error', description: 'Unable to generate PDF for download', variant: 'destructive' });
    }
  };

  // Shared validation used for both download and submit flows
  const validateForPdf = (): boolean => {
    if (!name) {
      toast({ title: 'Missing name', description: 'Please provide the customer name before generating or submitting the PDF.', variant: 'destructive' });
      return false;
    }
    if (!iban) {
      toast({ title: 'Missing IBAN', description: 'Please provide an IBAN before generating or submitting the PDF.', variant: 'destructive' });
      return false;
    }
    if (!validateIBAN(iban)) {
      toast({ title: 'Invalid IBAN', description: 'Please enter a valid IBAN (check characters and checksum).', variant: 'destructive' });
      return false;
    }
    if (!bic || !validateBIC(bic)) {
      toast({ title: 'Invalid BIC/SWIFT', description: 'Please enter a valid BIC (8 or 11 characters).', variant: 'destructive' });
      return false;
    }
    if (!consent) {
      toast({ title: 'Missing consent', description: 'Please confirm consent to direct debit before generating or submitting the PDF.', variant: 'destructive' });
      return false;
    }
    if (!signatureData) {
      toast({ title: 'Missing signature', description: 'Please provide a signature by drawing or uploading an image before generating or submitting the PDF.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // Require login
    if (!user || !(user as any)?.email) {
      // redirect to login and preserve the return location
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!name || !iban || !consent) {
      toast({ title: 'Missing information', description: 'Please provide name, IBAN and consent before submitting.', variant: 'destructive' });
      return;
    }

    // Validate IBAN and BIC
    const isIbanValid = validateIBAN(iban);
    if (!isIbanValid) {
      toast({ title: 'Invalid IBAN', description: 'Please enter a valid IBAN (check characters and checksum).', variant: 'destructive' });
      return;
    }

    if (!bic || !validateBIC(bic)) {
      toast({ title: 'Invalid BIC/SWIFT', description: 'Please enter a valid BIC (8 or 11 characters).', variant: 'destructive' });
      return;
    }

    if (!signatureData) {
      toast({ title: 'Missing signature', description: 'Please provide a signature by drawing or uploading an image.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // Build PDF doc
      const doc = buildPdf();
      const pdfBlob = doc.output('blob');

      // Convert PDF to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result as string | null;
        const base64PDF = result?.toString().split(',')[1] ?? '';

        const currentEmail = (user as any)?.email ?? '';

        const payload = {
          name: name || ((user as any)?.name ?? 'Unknown'),
          email: currentEmail,
          pps: '', 
          pdfData: base64PDF,
          type: 'sepa',
          meta: {
            iban,
            bic,
            creditor,
            signatureDate,
          },
        };

        const resp = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errJson = await resp.json().catch(() => ({}));
          toast({ title: 'Submit failed', description: errJson?.error || 'Unable to send SEPA details', variant: 'destructive' });
        } else {
          // show modal thank-you and hide the form
          toast({ title: 'SEPA form submitted', description: 'Your SEPA Direct Debit details have been recorded and emailed.' });
          setSubmitted(true);
        }

        setSubmitting(false);
      };

      reader.onerror = () => {
        toast({ title: 'PDF error', description: 'Unable to generate PDF', variant: 'destructive' });
        setSubmitting(false);
      };

    } catch (err) {
      console.error(err);
      toast({ title: 'Submit failed', description: 'Unable to submit SEPA details', variant: 'destructive' });
      setSubmitting(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`@media print { .no-print { display:none !important; } .signature-preview img { width: 80mm !important; height: auto !important; } } .signature-preview img { image-rendering: -webkit-optimize-contrast; }`}</style>
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <Card className="p-6">
          
          
          { !submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 " autoComplete="off">

              <h1 className="text-xl font-semibold mb-4 text-primary">SEPA Direct Debit (SEPA-DD) form</h1>

              <div className="bg-blue-50 border p-3 rounded">
                <p className="text-sm text-muted-foreground mb-6 font-semibold">By signing this mandate form, you authorise (A) Nexus Ventures Ltd to send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Nexus Ventures Ltd.
                  <br /><br />
                  As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited. Your rights are explained in a statement that you can obtain from your bank.
                  <br /><br />Please complete all the fields below marked *</p>
              </div>

              {/* Creditor identifier and legal text */}
              <div className="bg-blue-50 border p-3 rounded">
                <div className="mb-2 font-semibold">*Creditor Identifier: <span className="font-bold">IE75ZZZ362238</span></div>
              </div>

            {/* Customer details */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="sepa-name">*Customer Name</Label>
                <Input id="sepa-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
              </div>

              <div>
                <Label htmlFor="sepa-address">Customer Address</Label>
                <Textarea id="sepa-address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sepa-city">*City</Label>
                  <Input id="sepa-city" name="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="sepa-postcode">*Postcode</Label>
                  <Input id="sepa-postcode" name="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="sepa-country">*Country</Label>
                  <Input id="sepa-country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="off" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sepa-iban">*Account number (IBAN)</Label>
                  <Input id="sepa-iban" name="iban" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} required autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="sepa-bic">*Swift BIC</Label>
                  <Input id="sepa-bic" name="bic" value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())} autoComplete="off" />
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="border p-3 text-sm bg-white">
              <p className="mb-1">*Creditors Name : Nexus Ventures Limited & Irish Tax Agents Limited</p>
              <p className="mb-1">*Creditors Address: Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin. D04F1P2</p>
              <p>*Country : Republic of Ireland</p>
            </div>

            {/* Payment type and signing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <div className="mb-2 font-medium">*Type of payment</div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="paymentType" value="recurrent" checked={paymentType === 'recurrent'} onChange={() => setPaymentType('recurrent')} />
                    <span className="ml-1">Recurrent</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="paymentType" value="one-off" checked={paymentType === 'one-off'} onChange={() => setPaymentType('one-off')} />
                    <span className="ml-1">One-Off</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="signatureDate">*Date of signing</Label>
                <Input id="signatureDate" type="date" value={signatureDate} onChange={(e) => setSignatureDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="signature">*Signature(s)</Label>
              <SignaturePad ref={sigPadRef} accepted={Boolean(signatureData)} onChange={(data) => setSignatureData(data)} width={600} height={160} />
              {signatureData && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Signature preview</div>
                  <div className="signature-preview">
                    <img title="Accepted signature preview" src={signatureData} alt="signature preview" className="border rounded" style={{ maxWidth: 300 }} />
                  </div>
                  
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="sepa-consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
              <Label htmlFor="sepa-consent">I authorise the creditor to collect payments from my account by direct debit (SEPA) and I confirm that I am entitled to the account holder's signature.</Label>
            </div>

            <div className="flex justify-end">
                <div className="mt-6">
                  <FormActions onDownload={downloadPdf} onSubmit={() => handleSubmit()} isSubmitting={submitting} downloadLabel={'Download PDF'} submitLabel={submitting ? 'Submitting…' : 'Submit SEPA mandate'} downloadVariant="outline" />
                </div>
            </div>
            </form>
          ) : null}

          <ThankYouDialog
            open={submitted}
            onOpenChange={(v) => {
              // only allow closing the dialog by the provided button which resets the form
              if (!v) setSubmitted(false);
            }}
            title="Thank you"
            description={
              'Your SEPA Direct Debit mandate has been submitted. We have emailed you a copy.'
            }
            primaryLabel="Close"
            onPrimary={() => {
              // when primary button clicked, just close
              setSubmitted(false);
            }}
            secondaryLabel="New form"
            onSecondary={() => {
              // reset form state for a new submission
              setSubmitted(false);
              setName('');
              setAddress('');
              setCity('');
              setPostcode('');
              setCountry('');
              setIban('');
              setBic('');
              setPaymentType('');
              setSignatureData(null);
              setSignatureDate('');
              setConsent(false);
              setSubmitting(false);
              try { sigPadRef.current?.clear?.(); } catch (e) { /**/ }
            }}
          />
        </Card>
      </main>

      <Footer title="SEPA Direct Debit Mandate" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default SepaDd;
