import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const SepaDd: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [creditor, setCreditor] = useState('Nexus Ventures');
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
      // For now we just show a confirmation toast. If you want this saved to a
      // backend or generated as a PDF, we can wire that up (PocketBase, server
      // API, or client-side PDF generator).
      toast({ title: 'SEPA form submitted', description: 'Your SEPA Direct Debit details have been recorded.' });
    } catch (err) {
      toast({ title: 'Submit failed', description: 'Unable to submit SEPA details', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold mb-4">SEPA Direct Debit (SEPA-DD) form</h1>
        <p className="text-sm text-muted-foreground mb-6">Fill in the details below to create a SEPA Direct Debit mandate. This is a front-end form; submission currently only shows confirmation. Let me know if you want PDF generation or server-side saving.</p>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sepa-name">Account holder name</Label>
              <Input id="sepa-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sepa-iban">IBAN</Label>
              <Input id="sepa-iban" name="iban" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} required autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sepa-bic">BIC (optional)</Label>
              <Input id="sepa-bic" name="bic" value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sepa-creditor">Creditor name</Label>
              <Input id="sepa-creditor" name="creditor" value={creditor} onChange={(e) => setCreditor(e.target.value)} autoComplete="off" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sepa-address">Account holder address</Label>
            <Input id="sepa-address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sepa-mandate">Mandate reference (optional)</Label>
              <Input id="sepa-mandate" name="mandateRef" value={mandateRef} onChange={(e) => setMandateRef(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sepa-date">Signature date</Label>
              <Input id="sepa-date" name="signatureDate" type="date" value={signatureDate} onChange={(e) => setSignatureDate(e.target.value)} autoComplete="off" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="sepa-consent" checked={consent} onCheckedChange={(v: any) => setConsent(Boolean(v))} />
            <Label htmlFor="sepa-consent">I authorize the creditor to collect payments from my account by direct debit (SEPA) and I confirm that I am entitled to the account holder's signature.</Label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit SEPA mandate'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SepaDd;
