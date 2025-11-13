import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import FormActions from '@/components/FormActions';
import { Checkbox } from '@/components/ui/checkbox';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

type Props = {
  onSubmit?: (data: Record<string, any>) => void;
};

const CompanyIncorporationForm: React.FC<Props> = ({ onSubmit }) => {
  // Section 1 — Applicant Information
  const [applicantName, setApplicantName] = useState('');
  const [applicantAddress, setApplicantAddress] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');

  // Section 2 — New Company Information
  const [preferredName, setPreferredName] = useState('');
  const [alternativeName, setAlternativeName] = useState('');
  const [companyActivities, setCompanyActivities] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [eircode, setEircode] = useState('');

  // Section 3 — Representatives’ Information (Director)
  const [directorName, setDirectorName] = useState('');
  const [directorAddress, setDirectorAddress] = useState('');
  const [directorPhone, setDirectorPhone] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorDob, setDirectorDob] = useState('');
  const [directorNationality, setDirectorNationality] = useState('');
  const [directorPPS, setDirectorPPS] = useState('');
  const [directorProfession, setDirectorProfession] = useState('');
  const [moreThanOneDirector, setMoreThanOneDirector] = useState(false);

  // Secretary (optional)
  const [hasSecretary, setHasSecretary] = useState(false);
  const [secretaryName, setSecretaryName] = useState('');
  const [secretaryDob, setSecretaryDob] = useState('');
  const [secretaryAddress, setSecretaryAddress] = useState('');
  const [secretaryPhone, setSecretaryPhone] = useState('');
  const [secretaryEmail, setSecretaryEmail] = useState('');
  const [secretaryNationality, setSecretaryNationality] = useState('');

  // Section 4 — Company Ownership
  const [ownerNameNationality, setOwnerNameNationality] = useState('');
  const [additionalOwner, setAdditionalOwner] = useState('');

  // Section 5 — Share Capital
  const [shareOption, setShareOption] = useState<'100' | 'other'>('100');
  const [otherAmount, setOtherAmount] = useState('');

  // Section 6 — Final Confirmation
  const [confirmProceed, setConfirmProceed] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    // Section 1
    if (!applicantName.trim()) errs.applicantName = 'Applicant full name is required';
    if (!applicantAddress.trim()) errs.applicantAddress = 'Applicant address is required';
    if (!applicantPhone.trim()) errs.applicantPhone = 'Applicant phone number is required';
    if (!applicantEmail.trim()) errs.applicantEmail = 'Applicant email is required';

    // Section 2
    if (!preferredName.trim()) errs.preferredName = 'Preferred company name is required';
    if (!alternativeName.trim()) errs.alternativeName = 'Alternative company name is required';
    if (!companyActivities.trim()) errs.companyActivities = 'Description of company activities is required';
    if (!companyAddress.trim()) errs.companyAddress = 'Company address is required';
    if (!eircode.trim()) errs.eircode = 'Eircode / postal code is required';

    // Director
    if (!directorName.trim()) errs.directorName = 'Director full name is required';
    if (!directorAddress.trim()) errs.directorAddress = 'Director address is required';
    if (!directorPhone.trim()) errs.directorPhone = 'Director phone number is required';
    if (!directorEmail.trim()) errs.directorEmail = 'Director email is required';
    if (!directorDob.trim()) errs.directorDob = 'Director date of birth is required';
    if (!directorNationality.trim()) errs.directorNationality = 'Director nationality is required';
    if (!directorPPS.trim()) errs.directorPPS = 'Director PPS number is required';
    if (!directorProfession.trim()) errs.directorProfession = 'Director profession is required';

    // Secretary: only required if hasSecretary true
    if (hasSecretary) {
      if (!secretaryName.trim()) errs.secretaryName = 'Secretary full name is required';
      if (!secretaryDob.trim()) errs.secretaryDob = 'Secretary date of birth is required';
      if (!secretaryAddress.trim()) errs.secretaryAddress = 'Secretary address is required';
      if (!secretaryPhone.trim()) errs.secretaryPhone = 'Secretary phone is required';
      if (!secretaryEmail.trim()) errs.secretaryEmail = 'Secretary email is required';
      if (!secretaryNationality.trim()) errs.secretaryNationality = 'Secretary nationality is required';
    }

    // Ownership
    if (!ownerNameNationality.trim()) errs.ownerNameNationality = 'Owner name/nationality is required';

    // Share capital: if other selected, amount required
    if (shareOption === 'other' && !otherAmount.trim()) errs.otherAmount = 'Please specify the desired share capital';

    // Final confirmation
    if (!confirmProceed) errs.confirmProceed = 'You must confirm proceeding and the payment commitment';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) {
      Swal.fire({ icon: 'error', title: 'Please correct the form', text: 'Some required fields are missing or invalid.' });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        applicantName,
        applicantAddress,
        applicantPhone,
        applicantEmail,
        preferredName,
        alternativeName,
        companyActivities,
        companyAddress,
        eircode,
        director: {
          directorName,
          directorAddress,
          directorPhone,
          directorEmail,
          directorDob,
          directorNationality,
          directorPPS,
          directorProfession,
          moreThanOneDirector,
        },
        secretary: hasSecretary ? {
          secretaryName,
          secretaryDob,
          secretaryAddress,
          secretaryPhone,
          secretaryEmail,
          secretaryNationality,
        } : null,
        ownerNameNationality,
        additionalOwner: additionalOwner || null,
        shareCapital: shareOption === '100' ? 100 : Number(otherAmount || 0),
        confirmProceed,
      };

      // optional callback for parent to handle submission (e.g. store to server)
      onSubmit?.(data);

      await Swal.fire({
        icon: 'success',
        title: 'Submitted',
        text: 'Your incorporation request has been captured. We will contact you to proceed with payment and next steps.',
      });
      // keep data by default; caller may choose to clear on success
    } finally {
      setSubmitting(false);
    }
  };

  // Create a printable HTML snapshot of the form and open print dialog so user can save as PDF
  const handleDownloadPdf = () => {
    if (!validate()) {
      Swal.fire({ icon: 'error', title: 'Please complete the form', text: 'Fill the required fields before downloading the PDF.' });
      return;
    }

    const rows = (label: string, value: any) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;font-weight:600;width:260px">${label}</td>
        <td style="padding:8px;border:1px solid #ddd">${String(value ?? '')}</td>
      </tr>`;

    const owner = ownerNameNationality || '';
    const sec = hasSecretary ? `Secretary: ${secretaryName} (${secretaryNationality})` : '—';

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Company incorporation - ${preferredName || 'form'}</title>
      <style>body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:20px; color:#111} table{border-collapse:collapse;width:100%;max-width:800px} h1{font-size:18px;margin-bottom:8px}</style>
      </head><body>
      <h1>Company Incorporation Form</h1>
      <h2>Applicant information</h2>
      <table>${rows('Full name', applicantName)}${rows('Address', applicantAddress)}${rows('Phone', applicantPhone)}${rows('Email', applicantEmail)}</table>

      <h2 style="margin-top:16px">Company information</h2>
      <table>${rows('Preferred company name', preferredName)}${rows('Alternative name', alternativeName)}${rows('Activities', companyActivities)}${rows('Company address', companyAddress)}${rows('Eircode', eircode)}</table>

      <h2 style="margin-top:16px">Director</h2>
      <table>${rows('Name', directorName)}${rows('Address', directorAddress)}${rows('Phone', directorPhone)}${rows('Email', directorEmail)}${rows('Date of birth', directorDob)}${rows('Nationality', directorNationality)}${rows('PPS', directorPPS)}${rows('Profession', directorProfession)}${rows('Additional director(s)?', moreThanOneDirector ? 'Yes' : 'No')}</table>

      <h2 style="margin-top:16px">Secretary</h2>
      <table>${rows('Secretary appointed', hasSecretary ? 'Yes' : 'No')}${hasSecretary ? rows('Secretary name', secretaryName) : ''}${hasSecretary ? rows('Secretary DOB', secretaryDob) : ''}${hasSecretary ? rows('Secretary address', secretaryAddress) : ''}</table>

      <h2 style="margin-top:16px">Ownership & share capital</h2>
      <table>${rows('Owner (name & nationality)', owner)}${rows('Additional owner', additionalOwner)}${rows('Share capital', shareOption === '100' ? '€100' : otherAmount)}</table>

      <p style="margin-top:16px">I confirm to proceed with payment commitment: ${confirmProceed ? 'Yes' : 'No'}</p>
      <p style="margin-top:24px;font-size:12px;color:#666">Generated from Nexus Ventures form</p>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      Swal.fire({ icon: 'error', title: 'Popup blocked', text: 'Please allow popups to download the PDF or use browser print.' });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    // Use print; user can choose Save as PDF
    setTimeout(() => { try { w.print(); } catch (e) {} }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6">

      {/* Section 1 — Applicant Information */}
      <Card className="p-6 bg-muted/30">
        <CardHeader>
          <h3 className="text-lg font-semibold">Section 1 — Applicant Information</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name of Applicant</Label>
              <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} />
              {fieldErrors.applicantName && <div className="text-sm text-red-600 mt-1">{fieldErrors.applicantName}</div>}
            </div>
            <div>
              <Label>Applicant's Contact Email</Label>
              <Input type="email" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} />
              {fieldErrors.applicantEmail && <div className="text-sm text-red-600 mt-1">{fieldErrors.applicantEmail}</div>}
            </div>
            <div className="md:col-span-2">
              <Label>Full Address of Applicant</Label>
              <Textarea value={applicantAddress} onChange={(e) => setApplicantAddress(e.target.value)} />
              {fieldErrors.applicantAddress && <div className="text-sm text-red-600 mt-1">{fieldErrors.applicantAddress}</div>}
            </div>
            <div>
              <Label>Applicant's Contact Phone Number</Label>
              <Input value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} />
              {fieldErrors.applicantPhone && <div className="text-sm text-red-600 mt-1">{fieldErrors.applicantPhone}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — New Company Information */}
      <Card className="p-6 bg-muted/30">
        <CardHeader>
          <h3 className="text-lg font-semibold">Section 2 — New Company Information</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Preferred Company Name</Label>
              <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
              {fieldErrors.preferredName && <div className="text-sm text-red-600 mt-1">{fieldErrors.preferredName}</div>}
            </div>
            <div>
              <Label>Alternative Company Name</Label>
              <Input value={alternativeName} onChange={(e) => setAlternativeName(e.target.value)} />
              {fieldErrors.alternativeName && <div className="text-sm text-red-600 mt-1">{fieldErrors.alternativeName}</div>}
            </div>
            <div className="md:col-span-2">
              <Label>Description of Company Activities</Label>
              <Textarea value={companyActivities} onChange={(e) => setCompanyActivities(e.target.value)} />
              {fieldErrors.companyActivities && <div className="text-sm text-red-600 mt-1">{fieldErrors.companyActivities}</div>}
            </div>
            <div>
              <Label>Company Address</Label>
              <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
              {fieldErrors.companyAddress && <div className="text-sm text-red-600 mt-1">{fieldErrors.companyAddress}</div>}
            </div>
            <div>
              <Label>Eircode / Postal Code</Label>
              <Input value={eircode} onChange={(e) => setEircode(e.target.value)} />
              {fieldErrors.eircode && <div className="text-sm text-red-600 mt-1">{fieldErrors.eircode}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Representatives’ Information */}
      <Card className="p-6 bg-muted/30">
        <CardHeader>
          <h3 className="text-lg font-semibold">Section 3 — Representatives’ Information</h3>
          <div className="text-sm font-medium">Director Details</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Director's Full Name</Label>
              <Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} />
              {fieldErrors.directorName && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorName}</div>}
            </div>
            <div>
              <Label>Director's Contact Email</Label>
              <Input type="email" value={directorEmail} onChange={(e) => setDirectorEmail(e.target.value)} />
              {fieldErrors.directorEmail && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorEmail}</div>}
            </div>
            <div className="md:col-span-2">
              <Label>Director's Address</Label>
              <Textarea value={directorAddress} onChange={(e) => setDirectorAddress(e.target.value)} />
              {fieldErrors.directorAddress && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorAddress}</div>}
            </div>
            <div>
              <Label>Director's Contact Phone Number</Label>
              <Input value={directorPhone} onChange={(e) => setDirectorPhone(e.target.value)} />
              {fieldErrors.directorPhone && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorPhone}</div>}
            </div>
            <div>
              <Label>Director's Date of Birth</Label>
              <Input type="date" value={directorDob} onChange={(e) => setDirectorDob(e.target.value)} />
              {fieldErrors.directorDob && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorDob}</div>}
            </div>
            <div>
              <Label>Director's Nationality</Label>
              <Input value={directorNationality} onChange={(e) => setDirectorNationality(e.target.value)} />
              {fieldErrors.directorNationality && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorNationality}</div>}
            </div>
            <div>
              <Label>Director's PPS Number</Label>
              <Input value={directorPPS} onChange={(e) => setDirectorPPS(e.target.value)} />
              {fieldErrors.directorPPS && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorPPS}</div>}
            </div>
            <div>
              <Label>Director's Profession</Label>
              <Input value={directorProfession} onChange={(e) => setDirectorProfession(e.target.value)} />
              {fieldErrors.directorProfession && <div className="text-sm text-red-600 mt-1">{fieldErrors.directorProfession}</div>}
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Label>Does the company have more than one director?</Label>
                <div className="ml-2">
                  <label className="inline-flex items-center mr-3"><input type="radio" checked={!moreThanOneDirector} onChange={() => setMoreThanOneDirector(false)} /> <span className="ml-2">No</span></label>
                  <label className="inline-flex items-center ml-3"><input type="radio" checked={moreThanOneDirector} onChange={() => setMoreThanOneDirector(true)} /> <span className="ml-2">Yes</span></label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3b — Secretary Details */}
      <Card className="p-6 bg-muted/30">
        <CardHeader>
          <h4 className="text-base font-medium">Secretary Details (Required only if applicable)</h4>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="has-secretary" checked={hasSecretary} onCheckedChange={(v) => setHasSecretary(Boolean(v))} />
              <Label htmlFor="has-secretary">I will appoint a company secretary</Label>
            </div>
            {hasSecretary && (
              <>
                <div>
                  <Label>Secretary's Full Name</Label>
                  <Input value={secretaryName} onChange={(e) => setSecretaryName(e.target.value)} />
                  {fieldErrors.secretaryName && <div className="text-sm text-red-600 mt-1">{fieldErrors.secretaryName}</div>}
                </div>
                <div>
                  <Label>Secretary's Date of Birth</Label>
                  <Input type="date" value={secretaryDob} onChange={(e) => setSecretaryDob(e.target.value)} />
                  {fieldErrors.secretaryDob && <div className="text-sm text-red-600 mt-1">{fieldErrors.secretaryDob}</div>}
                </div>
                <div className="md:col-span-2">
                  <Label>Secretary's Address</Label>
                  <Textarea value={secretaryAddress} onChange={(e) => setSecretaryAddress(e.target.value)} />
                  {fieldErrors.secretaryAddress && <div className="text-sm text-red-600 mt-1">{fieldErrors.secretaryAddress}</div>}
                </div>
                <div>
                  <Label>Secretary's Telephone Number</Label>
                  <Input value={secretaryPhone} onChange={(e) => setSecretaryPhone(e.target.value)} />
                  {fieldErrors.secretaryPhone && <div className="text-sm text-red-600 mt-1">{fieldErrors.secretaryPhone}</div>}
                </div>
                <div>
                  <Label>Secretary's Email</Label>
                  <Input type="email" value={secretaryEmail} onChange={(e) => setSecretaryEmail(e.target.value)} />
                  {fieldErrors.secretaryEmail && <div className="text-sm text-red-600 mt-1">{fieldErrors.secretaryEmail}</div>}
                </div>
                <div>
                  <Label>Secretary's Nationality</Label>
                  <Input value={secretaryNationality} onChange={(e) => setSecretaryNationality(e.target.value)} />
                  {fieldErrors.secretaryNationality && <div className="text-sm text-red-600 mt-1">{fieldErrors.secretaryNationality}</div>}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Company Ownership */}
      <Card className="p-6 bg-muted/30">
        <CardHeader>
          <h3 className="text-lg font-semibold">Section 4 — Company Ownership</h3>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Full Name and Nationality of Company Owner</Label>
            <Input value={ownerNameNationality} onChange={(e) => setOwnerNameNationality(e.target.value)} />
            {fieldErrors.ownerNameNationality && <div className="text-sm text-red-600 mt-1">{fieldErrors.ownerNameNationality}</div>}
          </div>
          <div>
            <Label>Additional Owner (if any)</Label>
            <Input value={additionalOwner} onChange={(e) => setAdditionalOwner(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Section 5 — Share Capital */}
      <Card className="p-6 bg-muted/30">
        <CardHeader>
          <h3 className="text-lg font-semibold">Section 5 — Share Capital</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center"><input type="radio" checked={shareOption === '100'} onChange={() => setShareOption('100')} /> <span className="ml-2">€100</span></label>
            <label className="inline-flex items-center ml-4"><input type="radio" checked={shareOption === 'other'} onChange={() => setShareOption('other')} /> <span className="ml-2">Other Amount</span></label>
            {shareOption === 'other' && <Input className="w-40 ml-3" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} />}
            {fieldErrors.otherAmount && <div className="text-sm text-red-600 mt-1">{fieldErrors.otherAmount}</div>}
          </div>
        </CardContent>
      </Card>

      {/* Section 6 — Final Confirmation */}
      <Card className="p-6 bg-muted/30">
        <CardHeader>
          <h3 className="text-lg font-semibold">Section 6 — Final Confirmation</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Checkbox id="confirm-proceed" checked={confirmProceed} onCheckedChange={(v) => setConfirmProceed(Boolean(v))} />
            <label htmlFor="confirm-proceed" className="text-sm">Do you wish to proceed with the incorporation and accept the payment commitment of €399 + 23% VAT (€490.77)?</label>
          </div>
          {fieldErrors.confirmProceed && <div className="text-sm text-red-600 mt-1">{fieldErrors.confirmProceed}</div>}
        </CardContent>
        <CardFooter>
          <FormActions onDownload={handleDownloadPdf} onSubmit={() => handleSubmit()} isSubmitting={submitting} downloadLabel="Download PDF" submitLabel="Submit" />
        </CardFooter>
      </Card>
    </form>
  );
};

export default CompanyIncorporationForm;
