import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import nexusLogo from '@/assets/nexus-ventures-logo.png';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
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

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const buildPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
  // left/right constants removed — they were unused

    // Header band
    doc.setFillColor(228, 224, 206);
    doc.rect(10, 10, pageWidth - 20, 18, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SEPA Direct Debit Mandate', pageWidth / 2, 22, { align: 'center' });

    // Logo top-right
    try {
      const logoW = 30;
      const logoH = 12;
      doc.addImage(nexusLogo, 'PNG', pageWidth - 12 - logoW, 12, logoW, logoH);
    } catch (err) {
      // ignore
    }

    // Creditor identifier band placed immediately below the header
    const headerBottom = 10 + 18; // header top + height
    const creditorBandY = headerBottom + 2;
    const creditorBandH = 20;
    doc.setFillColor(219, 234, 254);
    doc.rect(10, creditorBandY, pageWidth - 20, creditorBandH, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    // place text vertically centered within the band
    doc.text('*Creditor Identifier: IE75ZZZ362238', 14, creditorBandY + creditorBandH / 2 + 4);

    // Legal text placed directly under the creditor band
    const legalStart = creditorBandY + creditorBandH + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const legal = 'By signing this mandate form, you authorise (A) Nexus Ventures Ltd to send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Nexus Ventures Ltd. As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. Please complete all the fields below marked *';
    const splitted = doc.splitTextToSize(legal, pageWidth - 24);
    doc.text(splitted, 12, legalStart);

    // Fields positions
    let y = legalStart + splitted.length * 4 + 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('*Customer Name :', 12, y);
    doc.setDrawColor(0);
    doc.rect(60, y - 6, pageWidth - 72, 8);
    if (name) {
      doc.setFont('helvetica', 'normal');
      doc.text(name, 62, y);
    }

    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Address:', 12, y);
    doc.setDrawColor(0);
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
    doc.text('*Account number (IBAN) :', 12, y);
    doc.rect(60, y - 6, pageWidth - 72, 8);
    if (iban) {
      doc.setFont('helvetica', 'normal');
      doc.text(iban, 62, y);
    }

    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text('*Swift BIC :', 12, y);
    doc.rect(60, y - 6, 60, 8);
    if (bic) {
      doc.setFont('helvetica', 'normal');
      doc.text(bic, 62, y);
    }

    // Info box
    y += 16;
    doc.setDrawColor(0);
    doc.rect(12, y, pageWidth - 24, 26);
    doc.setFontSize(9);
    doc.text('*Creditors Name : Nexus Ventures Limited & Irish Tax Agents Limited', 14, y + 6);
    doc.text('*Creditors : Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin. D04F1P2', 14, y + 12);
    doc.text('*Country : Republic of Ireland', 14, y + 18);

    // Payment type and date
    y += 36;
    doc.setFontSize(10);
    doc.text('*Type of payment', 12, y);
    // draw options with selectable markers
    const recurrentX = 70;
    const oneOffX = 140;
    // outline circles
    doc.setDrawColor(0);
    doc.circle(recurrentX, y - 1.5, 2, 'S');
    doc.text('Recurrent', recurrentX + 6, y);
    doc.circle(oneOffX, y - 1.5, 2, 'S');
    doc.text('One-Off', oneOffX + 6, y);
    // fill selection
    if (paymentType === 'recurrent') {
      doc.setFillColor(0, 0, 0);
      doc.circle(recurrentX, y - 1.5, 1.2, 'F');
    } else if (paymentType === 'one-off') {
      doc.setFillColor(0, 0, 0);
      doc.circle(oneOffX, y - 1.5, 1.2, 'F');
    }

    y += 12;
    doc.text('*Date of signing :', 12, y);
    doc.rect(45, y - 6, 60, 8);
    if (signatureDate) {
      doc.setFont('helvetica', 'normal');
      doc.text(signatureDate, 47, y);
    }

    // Signature box
    y += 18;
    doc.text('*Signature(s) :', 12, y);
    const sigX = 60;
    const sigY = y - 6;
    const sigW = 100;
    const sigH = 24;
    doc.rect(sigX, sigY, sigW, sigH);

    // draw signature if present (use high-res if available)
    try {
      // Prefer the accepted signature stored in state (signatureData).
      // Fall back to a high-res export from the signature pad if available.
      const dataUrl = signatureData ?? sigPadRef.current?.getDataUrl(3);
      if (dataUrl) {
        doc.addImage(dataUrl, 'PNG', sigX + 2, sigY + 2, sigW - 4, sigH - 4);
      }
    } catch (err) {
      console.warn('Failed to draw signature into PDF', err);
    }

    return doc;
  };

  const downloadPdf = () => {
    try {
      const doc = buildPdf();
      const date = new Date().toISOString().split('T')[0];
      doc.save(`sepa-mandate-${date}.pdf`);
    } catch (err) {
      console.error('Error generating PDF for download', err);
      toast({ title: 'PDF error', description: 'Unable to generate PDF for download', variant: 'destructive' });
    }
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
          toast({ title: 'SEPA form submitted', description: 'Your SEPA Direct Debit details have been recorded and emailed.' });
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
          <h1 className="text-xl font-semibold mb-4">SEPA Direct Debit (SEPA-DD) form</h1>
          <div className="bg-blue-50 border p-3 rounded">
          <p className="text-sm text-muted-foreground mb-6 font-semibold"> By signing this mandate form, you authorise (A) Nexus Ventures Ltd to send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with the instruction from Nexus Ventures Ltd. <br/><br/>
                As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited. Your rights are explained in a statement that you can obtain from your bank.  
                Please complete all the fields below marked *</p>
          </div>
          <br/>
          <form onSubmit={handleSubmit} className="space-y-4 " autoComplete="off">

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
              <p className="mb-1">*Creditors : Nexus, Officepods Cranford Centre, Stillorgan Rd., Dublin. D04F1P2</p>
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
        </Card>
      </main>

      <Footer title="SEPA Direct Debit Mandate" subtitle="For tax compliance purposes. Keep records for at least 6 years." />
    </div>
  );
};

export default SepaDd;
