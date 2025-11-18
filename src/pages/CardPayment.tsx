import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateCardPaymentPDF } from '@/utils/pdfGenerator';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
import { toast } from '@/components/ui/use-toast';
import ThankYouDialog from '@/components/ThankYouDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import FormActions from '@/components/FormActions';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Basic card Luhn check
function luhnCheck(num: string): boolean {
  const s = num.replace(/\s+/g, '');
  if (!/^[0-9]{13,19}$/.test(s)) return false;
  let sum = 0;
  let flip = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (flip) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    flip = !flip;
  }
  return sum % 10 === 0;
}

const CardPayment: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [creditor] = useState('Irish Tax Agents Ltd.');
  const [paymentType, setPaymentType] = useState<'recurrent' | 'one-off' | ''>('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const sigPadRef = useRef<SignaturePadHandle | null>(null);
  const [signatureDate, setSignatureDate] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [thankYouOpen, setThankYouOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const buildPdf = () =>
    generateCardPaymentPDF({
      name,
      address,
      city,
      postcode,
      country,
      cardNumber,
      expiry,
      cvc,
      creditor,
      paymentType,
      signatureDate,
      signatureData: signatureData ?? sigPadRef.current?.getDataUrl(1.5) ?? null,
    });

  const downloadPdf = () => {
    try {
      const doc = buildPdf();
      const date = new Date().toISOString().split('T')[0];
      doc.save(`card-payment-${date}.pdf`);
    } catch (err) {
      console.error('Error generating PDF for download', err);
      toast({ title: 'PDF error', description: 'Unable to generate PDF for download', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !(user as any)?.email) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!name || !cardNumber || !expiry || !cvc || !consent) {
      toast({ title: 'Missing information', description: 'Please complete required fields before submitting.', variant: 'destructive' });
      return;
    }

    if (!luhnCheck(cardNumber)) {
      toast({ title: 'Invalid card number', description: 'Please enter a valid card number.', variant: 'destructive' });
      return;
    }

    if (!/^[0-9]{3,4}$/.test(cvc)) {
      toast({ title: 'Invalid CVC', description: 'Please enter a valid 3 or 4 digit CVC.', variant: 'destructive' });
      return;
    }

    if (!signatureData) {
      toast({ title: 'Missing signature', description: 'Please provide a signature by drawing or uploading an image.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const doc = buildPdf();
      const pdfBlob = doc.output('blob');
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
          type: 'card',
          meta: {
            cardNumber: cardNumber.replace(/\s+/g, ''),
            expiry,
            cvc,
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
          toast({ title: 'Submit failed', description: errJson?.error || 'Unable to send card payment details', variant: 'destructive' });
        } else {
          toast({ title: 'Card payment form submitted', description: 'Your card payment details have been recorded and emailed.' });
          setThankYouOpen(true);
        }

        setSubmitting(false);
      };

      reader.onerror = () => {
        toast({ title: 'PDF error', description: 'Unable to generate PDF', variant: 'destructive' });
        setSubmitting(false);
      };

    } catch (err) {
      console.error(err);
      toast({ title: 'Submit failed', description: 'Unable to submit card payment details', variant: 'destructive' });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`@media print { .no-print { display:none !important; } .signature-preview img { width: 80mm !important; height: auto !important; } } .signature-preview img { image-rendering: -webkit-optimize-contrast; }`}</style>
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <Card className="p-6">
          <h1 className="text-xl font-semibold mb-4 text-primary">Card Payment form</h1>
          <div className="bg-blue-50 border p-3 rounded">
            <p className="text-sm text-muted-foreground mb-6 font-semibold">Legal Text: By signing this mandate form, you authorise (A) Irish Tax Agents LTD. To send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Irish Tax Agents LTD.<br/><br/>
    As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited. Your rights are explained in a statement that you can obtain from your bank.<br/><br/>
    Please complete all the fields below marked *</p>
          </div>
            <br/>
          <form onSubmit={handleSubmit} className="space-y-4 " autoComplete="off">
            <div className="bg-blue-50 border p-3 rounded">
              <div className="mb-2 font-semibold">*Creditor Identifier: <span className="font-bold">IE58ZZZ362641</span></div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="card-name">*Name</Label>
                <Input id="card-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
              </div>

              <div>
                <Label htmlFor="card-address">*Address</Label>
                <Textarea id="card-address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="card-city">*City</Label>
                  <Input id="card-city" name="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="card-postcode">*Postcode</Label>
                  <Input id="card-postcode" name="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="card-country">*Country</Label>
                  <Input id="card-country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="off" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-number">*Card Number</Label>
                  <Input id="card-number" name="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required autoComplete="off" />
                </div>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-1">
                    <Label htmlFor="card-expiry">*Expiration Date</Label>
                    <Input id="card-expiry" type="month" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="card-cvc">*CVC</Label>
                    <Input id="card-cvc" name="cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border p-3 text-sm bg-white">
              <p className="mb-1">*Creditors Name : Irish Tax Agents Limited</p>
              <p className="mb-1">*Creditors Address : Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin 4 (D04F1P2)</p>
              <p>*Country : Republic of Ireland</p>
            </div>

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
                    <span className="ml-1">One-Off Payment</span>
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
              <Checkbox id="card-consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
              <Label htmlFor="card-consent">I authorise the creditor to collect payments from my card and I confirm that I am entitled to use this card.</Label>
            </div>

              <div className="flex justify-end">
                <div className="mt-6">
                  <FormActions onDownload={downloadPdf} onSubmit={() => handleSubmit()} isSubmitting={submitting} downloadLabel={'Download PDF'} submitLabel={submitting ? 'Submitting…' : 'Submit Card payment'} downloadVariant="outline" />
                </div>
              </div>
            </form>

            <ThankYouDialog
              open={thankYouOpen}
              onOpenChange={(v) => setThankYouOpen(v)}
              title="Thank you"
              description={'Your card payment form has been submitted. A copy has been emailed to you.'}
              primaryLabel="Done"
              onPrimary={() => { /* no-op */ }}
            />
        </Card>
      </main>

      <Footer title="Card Payment Mandate" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default CardPayment;
