import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/Header';
import nexusLogo from '@/assets/nexus-ventures-logo.png';

const SepaDd: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [creditor, setCreditor] = useState('Nexus Ventures');
  const [uniqueMandateRef, setUniqueMandateRef] = useState('');
  const [paymentType, setPaymentType] = useState<'recurrent' | 'one-off' | ''>('');
  const [mandateRef, setMandateRef] = useState('');
  const [signatureDate, setSignatureDate] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name || !iban || !consent) {
      toast({ title: 'Missing information', description: 'Please provide name, IBAN and consent before submitting.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      toast({ title: 'SEPA form submitted', description: 'Your SEPA Direct Debit details have been recorded.' });
    } catch (err) {
      toast({ title: 'Submit failed', description: 'Unable to submit SEPA details', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6">
          <h1 className="text-xl font-semibold mb-4">SEPA Direct Debit (SEPA-DD) form</h1>
          <p className="text-sm text-muted-foreground mb-6">Fill in the details below to create a SEPA Direct Debit mandate. This is a front-end form; submission currently only shows confirmation. Let me know if you want PDF generation or server-side saving.</p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sepa-unique">*Unique Mandate Reference</Label>
                  <Input id="sepa-unique" name="uniqueMandateRef" value={uniqueMandateRef} onChange={(e) => setUniqueMandateRef(e.target.value)} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sepa-creditor">Creditor Identifier</Label>
                  <Input id="sepa-creditor" name="creditor" value={creditor} onChange={(e) => setCreditor(e.target.value)} autoComplete="off" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="sepa-name">*Customer Name</Label>
                  <Input id="sepa-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="sepa-address">Customer Address</Label>
                  <Input id="sepa-address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="sepa-city">*City/postcode</Label>
                  <Input id="sepa-city" name="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="sepa-postcode">&nbsp;</Label>
                  <Input id="sepa-postcode" name="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="sepa-country">*Country</Label>
                  <Input id="sepa-country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="off" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
            <div className="flex items-center space-x-2">
              <Checkbox id="sepa-consent" checked={consent} onCheckedChange={(v: any) => setConsent(Boolean(v))} />
              <Label htmlFor="sepa-consent">I authorize the creditor to collect payments from my account by direct debit (SEPA) and I confirm that I am entitled to the account holder's signature.</Label>
            </div>

            <div className="flex justify-end">
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit SEPA mandate'}</Button>
              </div>
            </div>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                src={nexusLogo}
                alt="Nexus Ventures"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="text-center">
              <p>SEPA Direct Debit Mandate</p>
              <p className="mt-1">This form creates a SEPA mandate for recurring or one-off direct debits.</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.nexusventures.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <span className="underline">www.nexusventures.eu</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SepaDd;
