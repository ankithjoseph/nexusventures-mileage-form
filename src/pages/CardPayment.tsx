import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import nexusLogo from '@/assets/nexus-ventures-logo.png';
import italogo from '@/assets/ITA-logo.png';
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

  const buildPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header band
    doc.setFillColor(228, 224, 206);
    doc.rect(10, 10, pageWidth - 20, 18, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CARD PAYMENT', pageWidth / 2, 22, { align: 'center' });

    // Logo top-right
    try {
      const logoW = 30;
      const logoH = 14;
      doc.addImage(italogo, 'PNG', pageWidth - 12 - logoW, 12, logoW, logoH);
    } catch (err) {
      // ignore
    }

    // Creditor identifier band
    const headerBottom = 10 + 18;
    const creditorBandY = headerBottom + 2;
    const creditorBandH = 20;
    doc.setFillColor(219, 234, 254);
    doc.rect(10, creditorBandY, pageWidth - 20, creditorBandH, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('*Creditor Identifier: IE58ZZZ362641', 14, creditorBandY + creditorBandH / 2 + 4);

    // Legal text
    const legalStart = creditorBandY + creditorBandH + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const legal = `Legal Text: By signing this mandate form, you authorise (A) Irish Tax Agents LTD. To send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Irish Tax Agents LTD.\nAs part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited. Your rights are explained in a statement that you can obtain from your bank. Please complete all the fields below marked *`;
    const splitted = doc.splitTextToSize(legal, pageWidth - 24);
    doc.text(splitted, 12, legalStart);

    // Fields positions
    let y = legalStart + splitted.length * 4 + 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Name :', 12, y);
    doc.rect(60, y - 6, pageWidth - 72, 8);
    if (name) {
      doc.setFont('helvetica', 'normal');
      doc.text(name, 62, y);
    }

    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Address:', 12, y);
    doc.rect(60, y - 8, pageWidth - 72, 24);
    if (address) {
      doc.setFont('helvetica', 'normal');
      const addressLines = doc.splitTextToSize(address, pageWidth - 80);
      doc.text(addressLines, 62, y + 2);
    }

    y += 34;
    doc.setFont('helvetica', 'bold');
    // City, Postcode and Country fields (three separate boxes)
  // place labels to the left of each box and adjust box widths to fit the page
  doc.text('*City:', 12, y);
  // compute box geometry (kept simple constants to match layout)
  const cityBoxX = 30;
  const cityBoxW = 40; // reduced width so city box is not excessively wide
  const postcodeBoxX = cityBoxX + cityBoxW + 25; // small gap
  const postcodeBoxW = 40;
  const countryBoxW = 40;
  const countryBoxX = pageWidth- countryBoxW-12;

  // boxes
  doc.rect(cityBoxX, y - 6, cityBoxW, 8);   // city box
  doc.rect(postcodeBoxX, y - 6, postcodeBoxW, 8);  // postcode box
  doc.rect(countryBoxX, y - 6, countryBoxW, 8);  // country box

  // labels for postcode and country placed left of their boxes
  doc.text('*Postcode:', postcodeBoxX - 22, y);
  doc.text('*Country:', countryBoxX - 20, y);

  // field values inside boxes
  if (city) {
    doc.setFont('helvetica', 'normal');
    doc.text(city, cityBoxX + 2, y);
  }
  if (postcode) {
    doc.setFont('helvetica', 'normal');
    doc.text(postcode, postcodeBoxX + 2, y);
  }
  if (country) {
    doc.setFont('helvetica', 'normal');
    doc.text(country, countryBoxX + 2, y);
  }

    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text('*Card Number', 12, y);
    doc.rect(60, y - 6, pageWidth - 72, 8);
    if (cardNumber) {
      doc.setFont('helvetica', 'normal');
      doc.text(cardNumber, 62, y);
    }

    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text('*Expiration Date', 12, y);
    doc.rect(60, y - 6, 40, 8);
    doc.text('*CVC', 110, y);
    doc.rect(126, y - 6, 30, 8);
    if (expiry) doc.setFont('helvetica', 'normal'), doc.text(expiry, 62, y);
    if (cvc) doc.setFont('helvetica', 'normal'), doc.text(cvc, 128, y);

    // Info box
    y += 16;
    doc.setDrawColor(0);
    doc.rect(12, y, pageWidth - 24, 28);
    doc.setFontSize(9);
    doc.text('*Creditors Name: Irish Tax Agents Limited', 14, y + 6);
    doc.text('*Creditors Address: Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin 4 (D04F1P2)', 14, y + 12);
    doc.text('*Country: Republic of Ireland', 14, y + 18);

    y += 36;
    doc.setFontSize(10);
    doc.text('*Type of payment', 12, y);
    const recurrentX = 90;
    const oneOffX = 160;
    doc.circle(recurrentX, y - 1.5, 2, 'S');
    doc.text('Recurrent', recurrentX + 6, y);
    doc.circle(oneOffX, y - 1.5, 2, 'S');
    doc.text('One-Off Payment', oneOffX + 6, y);
    if (paymentType === 'recurrent') {
      doc.setFillColor(0, 0, 0);
      doc.circle(recurrentX, y - 1.5, 1.2, 'F');
    } else if (paymentType === 'one-off') {
      doc.setFillColor(0, 0, 0);
      doc.circle(oneOffX, y - 1.5, 1.2, 'F');
    }

    y += 12;
    doc.text('*Date of signing:', 12, y);
    doc.rect(45, y - 6, 60, 8);
    if (signatureDate) doc.setFont('helvetica', 'normal'), doc.text(signatureDate, 47, y);

    y += 18;
    doc.text('*Signature(s):', 12, y);
    const sigX = 60;
    const sigY = y - 6;
    const sigW = 100;
    const sigH = 24;
    doc.rect(sigX, sigY, sigW, sigH);
    try {
      const dataUrl = signatureData ?? sigPadRef.current?.getDataUrl(3);
      if (dataUrl) doc.addImage(dataUrl, 'PNG', sigX + 2, sigY + 2, sigW - 4, sigH - 4);
    } catch (err) {
      // ignore
    }

    return doc;
  };

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
