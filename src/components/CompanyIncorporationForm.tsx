import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import FormActions from '@/components/FormActions';
import { generateCompanyIncorporationPDF } from '@/utils/pdfGenerator';
import SignaturePad from '@/components/SignaturePad';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

type DirectorFormState = {
  fullName: string;
  email: string;
  address: string;
  phone: string;
  dob: string;
  nationality: string;
  pps: string;
  profession: string;
};

type OwnerFormState = {
  fullName: string;
  nationality: string;
  sharePercentage: string;
};

export type CompanyIncorporationData = {
  applicant: {
    fullName: string;
    email: string;
    address: string;
    phone: string;
  };
  company: {
    preferredName: string;
    alternativeName: string;
    activities: string;
    address: string;
    eircode: string;
  };
  directors: DirectorFormState[];
  hasMultipleDirectors: boolean;
  secretary: {
    fullName: string;
    dob: string;
    address: string;
    phone: string;
    email: string;
    nationality: string;
    isNexusSecretary: boolean;
  } | null;
  ownership: {
    owners: Array<{
      fullName: string;
      nationality: string;
      sharePercentage: number;
    }>;
  };
  shareCapital: number;
  confirmProceed: boolean;
  signatureData?: string | null;
  signatureDate?: string;
};

type FormState = {
  applicantName: string;
  applicantEmail: string;
  applicantAddress: string;
  applicantPhone: string;
  preferredName: string;
  alternativeName: string;
  companyActivities: string;
  companyAddress: string;
  companyEircode: string;
  secretaryName: string;
  secretaryDob: string;
  secretaryAddress: string;
  secretaryPhone: string;
  secretaryEmail: string;
  secretaryNationality: string;
  secretaryIsNexus: boolean;
};

type Props = {
  onSubmit?: (data: CompanyIncorporationData) => Promise<void> | void;
};

const initialFormState: FormState = {
  applicantName: '',
  applicantEmail: '',
  applicantAddress: '',
  applicantPhone: '',
  preferredName: '',
  alternativeName: '',
  companyActivities: '',
  companyAddress: '',
  companyEircode: '',
  secretaryName: '',
  secretaryDob: '',
  secretaryAddress: '',
  secretaryPhone: '',
  secretaryEmail: '',
  secretaryNationality: '',
  secretaryIsNexus: false,
};

const createEmptyDirector = (): DirectorFormState => ({
  fullName: '',
  email: '',
  address: '',
  phone: '',
  dob: '',
  nationality: '',
  pps: '',
  profession: ''
});

const directorErrorKey = (index: number, field: keyof DirectorFormState) => `director-${index}-${field}`;

const createEmptyOwner = (): OwnerFormState => ({
  fullName: '',
  nationality: '',
  sharePercentage: ''
});

const ownerErrorKey = (index: number, field: keyof OwnerFormState) => `owner-${index}-${field}`;

const CompanyIncorporationForm: React.FC<Props> = ({ onSubmit }) => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [directors, setDirectors] = useState<DirectorFormState[]>([createEmptyDirector()]);
  const [owners, setOwners] = useState<OwnerFormState[]>([createEmptyOwner()]);
  const [hasMultipleDirectors, setHasMultipleDirectors] = useState(false);
  const [shareOption, setShareOption] = useState<'100' | 'other'>('100');
  const [otherAmount, setOtherAmount] = useState('');
  const [confirmProceed, setConfirmProceed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureDate, setSignatureDate] = useState('');

  const handleChange = (
    field: keyof FormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof FormState) => (checked: boolean | 'indeterminate') => {
    const value = checked === true;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDirectorChange = (
    index: number,
    field: keyof DirectorFormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setDirectors((prev) =>
      prev.map((director, dirIndex) => (dirIndex === index ? { ...director, [field]: value } : director))
    );
  };

  const handleOwnerChange = (
    index: number,
    field: keyof OwnerFormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setOwners((prev) => prev.map((owner, ownerIndex) => (ownerIndex === index ? { ...owner, [field]: value } : owner)));
  };

  const handleDirectorToggle = (multiple: boolean) => {
    setHasMultipleDirectors(multiple);
    setDirectors((prev) => {
      if (!multiple) {
        return prev.length ? [prev[0]] : [createEmptyDirector()];
      }
      if (multiple && prev.length === 1) {
        return [...prev, createEmptyDirector()];
      }
      return prev;
    });
  };

  const addDirector = () => {
    setDirectors((prev) => [...prev, createEmptyDirector()]);
  };

  const removeDirector = (index: number) => {
    setDirectors((prev) => prev.filter((_, dirIndex) => dirIndex !== index));
  };

  const addOwner = () => {
    setOwners((prev) => [...prev, createEmptyOwner()]);
  };

  const removeOwner = (index: number) => {
    setOwners((prev) => prev.filter((_, ownerIndex) => ownerIndex !== index));
  };

  const ownershipShareTotal = owners.reduce((sum, owner) => sum + Number(owner.sharePercentage || 0), 0);
  const ownershipTotalExceeds100 = ownershipShareTotal - 100 > 0.01;

  const requiredFields: Array<keyof FormState> = [
    'applicantName',
    'applicantEmail',
    'applicantAddress',
    'applicantPhone',
    'preferredName',
    'alternativeName',
    'companyActivities',
    'companyAddress',
    'companyEircode'
  ];

  const directorRequiredFields: Array<keyof DirectorFormState> = [
    'fullName',
    'email',
    'address',
    'phone',
    'dob',
    'nationality',
    'pps',
    'profession'
  ];

  const ownerRequiredFields: Array<keyof OwnerFormState> = ['fullName', 'nationality', 'sharePercentage'];

  const validate = () => {
    const errors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      const value = form[field];
      if (typeof value === 'string') {
        if (!value.trim()) {
          errors[field] = 'This field is required';
        }
      }
    });

    directors.forEach((director, index) => {
      directorRequiredFields.forEach((field) => {
        if (!director[field]?.trim()) {
          errors[directorErrorKey(index, field)] = 'This field is required';
        }
      });
    });

    if (hasMultipleDirectors && directors.length < 2) {
      errors.directorsCount = 'Please add details for at least two directors.';
    }

    if (!owners.length) {
      errors.ownersCount = 'Please add at least one company owner.';
    }

    owners.forEach((owner, index) => {
      ownerRequiredFields.forEach((field) => {
        if (!owner[field]?.trim()) {
          errors[ownerErrorKey(index, field)] = 'This field is required';
        }
      });

      if (owner.sharePercentage?.trim()) {
        const parsed = Number(owner.sharePercentage);
        if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
          errors[ownerErrorKey(index, 'sharePercentage')] = 'Enter a percentage between 0 and 100';
        }
      }
    });

    const totalSharePercentage = owners.reduce((sum, owner) => sum + Number(owner.sharePercentage || 0), 0);
    if (Math.abs(totalSharePercentage - 100) > 0.01) {
      errors.ownershipTotal = 'Share percentages must add up to 100%.';
    }

    if (!form.secretaryIsNexus) {
      ['secretaryName', 'secretaryDob', 'secretaryAddress', 'secretaryPhone', 'secretaryEmail', 'secretaryNationality'].forEach(
        (field) => {
          const value = form[field as keyof FormState];
          if (typeof value === 'string') {
            if (!value.trim()) {
              errors[field] = 'This field is required';
            }
          }
        }
      );
    }

    if (shareOption === 'other') {
      const trimmedAmount = otherAmount.trim();
      if (!trimmedAmount) {
        errors.otherAmount = 'Please specify the desired share capital';
      } else if (!Number.isFinite(Number(trimmedAmount))) {
        errors.otherAmount = 'Please enter a valid numeric amount';
      }
    }

    if (!confirmProceed) {
      errors.confirmProceed = 'You must confirm before submitting';
    }

    if (!signatureDate) {
      errors.signatureDate = 'Please provide date of signing';
    }

    if (!signatureData) {
      errors.signatureData = 'Please provide a signature';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): CompanyIncorporationData => ({
    applicant: {
      fullName: form.applicantName,
      email: form.applicantEmail,
      address: form.applicantAddress,
      phone: form.applicantPhone
    },
    company: {
      preferredName: form.preferredName,
      alternativeName: form.alternativeName,
      activities: form.companyActivities,
      address: form.companyAddress,
      eircode: form.companyEircode
    },
    directors: directors.map((director) => ({
      fullName: director.fullName,
      email: director.email,
      address: director.address,
      phone: director.phone,
      dob: director.dob,
      nationality: director.nationality,
      pps: director.pps,
      profession: director.profession
    })),
    hasMultipleDirectors,
    secretary: {
      fullName: form.secretaryName,
      dob: form.secretaryDob,
      address: form.secretaryAddress,
      phone: form.secretaryPhone,
      email: form.secretaryEmail,
      nationality: form.secretaryNationality,
      isNexusSecretary: form.secretaryIsNexus
    },
    ownership: {
      owners: owners.map((owner) => ({
        fullName: owner.fullName,
        nationality: owner.nationality,
        sharePercentage: Number(owner.sharePercentage || 0)
      }))
    },
    shareCapital: shareOption === '100' ? 100 : Number(otherAmount || 0),
    confirmProceed,
    signatureData,
    signatureDate
  });

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!validate()) {
      await Swal.fire({
        icon: 'error',
        title: 'Please review the form',
        text: 'Some required fields are missing.'
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      await onSubmit?.(payload);
      await Swal.fire({
        icon: 'success',
        title: 'Submission received',
        text: 'We will contact you to proceed with payment and next steps.'
      });
    } catch (err) {
      console.error('Company incorporation onSubmit failed:', err);
      const msg = err instanceof Error ? err.message : 'Unable to submit incorporation form';
      await Swal.fire({
        icon: 'error',
        title: 'Submission failed',
        text: msg
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    const payload = buildPayload();
    const doc = generateCompanyIncorporationPDF(payload);
    doc.save('company-incorporation.pdf');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>

        <CardContent className="space-y-4 text-sm text-muted-foreground pt-4 bg-muted/100">
          <p>
            All companies in Ireland must be represented by at least one director and one company secretary (if there is more than
            one director, the secretary can be one of the company directors). If you would like us to represent you as your company
            secretary or wish to use our registered office service, please indicate NEXUS in the relevant section of the form.
          </p>
          <p>
            A company's authorized share capital can be higher than the €100 you need to pay to start your business, which can be the
            minimum. To proceed with the official incorporation of your company, please note that we will need an identity document
            and proof of residence from the applicant, the director(s), the company secretary, and the company partners.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleDownloadPdf} disabled={submitting}>
          Download PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <h3 className="text-lg font-semibold">Applicant Information</h3>
            <p className="text-sm text-muted-foreground">Provide contact details for the person submitting this request.</p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name of Applicant</Label>
            <Input value={form.applicantName} onChange={handleChange('applicantName')} autoCapitalize="words" />
            {fieldErrors.applicantName && <p className="text-sm text-red-600 mt-1">{fieldErrors.applicantName}</p>}
          </div>
          <div>
            <Label>Applicant's Contact Email</Label>
            <Input type="email" value={form.applicantEmail} onChange={handleChange('applicantEmail')} autoCapitalize="off" />
            {fieldErrors.applicantEmail && <p className="text-sm text-red-600 mt-1">{fieldErrors.applicantEmail}</p>}
          </div>
          <div className="md:col-span-2">
            <Label>Full Address of Applicant</Label>
            <Textarea value={form.applicantAddress} onChange={handleChange('applicantAddress')} autoCapitalize="words" />
            {fieldErrors.applicantAddress && <p className="text-sm text-red-600 mt-1">{fieldErrors.applicantAddress}</p>}
          </div>
          <div>
            <Label>Applicant's Contact Phone Number</Label>
            <Input value={form.applicantPhone} onChange={handleChange('applicantPhone')} autoCapitalize="off" />
            {fieldErrors.applicantPhone && <p className="text-sm text-red-600 mt-1">{fieldErrors.applicantPhone}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Company Information</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Preferred Company Name</Label>
            <Input value={form.preferredName} onChange={handleChange('preferredName')} autoCapitalize="words" />
            {fieldErrors.preferredName && <p className="text-sm text-red-600 mt-1">{fieldErrors.preferredName}</p>}
          </div>
          <div>
            <Label>Alternative Company Name</Label>
            <Input value={form.alternativeName} onChange={handleChange('alternativeName')} autoCapitalize="words" />
            {fieldErrors.alternativeName && <p className="text-sm text-red-600 mt-1">{fieldErrors.alternativeName}</p>}
          </div>
          <div className="md:col-span-2">
            <Label>Description of Company Activities</Label>
            <Textarea value={form.companyActivities} onChange={handleChange('companyActivities')} autoCapitalize="sentences" />
            {fieldErrors.companyActivities && <p className="text-sm text-red-600 mt-1">{fieldErrors.companyActivities}</p>}
          </div>
          <div>
            <Label>Company Address</Label>
            <Input value={form.companyAddress} onChange={handleChange('companyAddress')} autoCapitalize="words" />
            {fieldErrors.companyAddress && <p className="text-sm text-red-600 mt-1">{fieldErrors.companyAddress}</p>}
          </div>
          <div>
            <Label>Eircode / Postal Code</Label>
            <Input value={form.companyEircode} onChange={handleChange('companyEircode')} autoCapitalize="off" />
            {fieldErrors.companyEircode && <p className="text-sm text-red-600 mt-1">{fieldErrors.companyEircode}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <h3 className="text-lg font-semibold">Representatives’ Information</h3>
            <p className="text-sm text-muted-foreground">Director Details</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Does the company have more than one director?</Label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={!hasMultipleDirectors} onChange={() => handleDirectorToggle(false)} />
                No
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={hasMultipleDirectors} onChange={() => handleDirectorToggle(true)} />
                Yes
              </label>
            </div>
          </div>

          <div className="space-y-6">
            {directors.map((director, index) => (
              <div key={`director-${index}`} className="rounded-xl border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Director {index + 1}</p>
                    <p className="text-sm text-muted-foreground">Provide identification and contact details.</p>
                  </div>
                  {hasMultipleDirectors && directors.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeDirector(index)}>
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={director.fullName} onChange={handleDirectorChange(index, 'fullName')} autoCapitalize="words" />
                    {fieldErrors[directorErrorKey(index, 'fullName')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'fullName')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input type="email" value={director.email} onChange={handleDirectorChange(index, 'email')} autoCapitalize="off" />
                    {fieldErrors[directorErrorKey(index, 'email')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'email')]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Textarea value={director.address} onChange={handleDirectorChange(index, 'address')} autoCapitalize="words" />
                    {fieldErrors[directorErrorKey(index, 'address')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'address')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Contact Phone Number</Label>
                    <Input value={director.phone} onChange={handleDirectorChange(index, 'phone')} autoCapitalize="off" />
                    {fieldErrors[directorErrorKey(index, 'phone')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'phone')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={director.dob} onChange={handleDirectorChange(index, 'dob')} />
                    {fieldErrors[directorErrorKey(index, 'dob')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'dob')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Input value={director.nationality} onChange={handleDirectorChange(index, 'nationality')} autoCapitalize="words" />
                    {fieldErrors[directorErrorKey(index, 'nationality')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'nationality')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>PPS Number</Label>
                    <Input value={director.pps} onChange={handleDirectorChange(index, 'pps')} autoCapitalize="off" />
                    {fieldErrors[directorErrorKey(index, 'pps')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'pps')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Profession</Label>
                    <Input value={director.profession} onChange={handleDirectorChange(index, 'profession')} autoCapitalize="words" />
                    {fieldErrors[directorErrorKey(index, 'profession')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[directorErrorKey(index, 'profession')]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMultipleDirectors && (
            <Button type="button" variant="outline" onClick={addDirector}>
              Add another director
            </Button>
          )}
          {fieldErrors.directorsCount && <p className="text-sm text-red-600">{fieldErrors.directorsCount}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h4 className="text-base font-medium">Secretary Details</h4>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2 md:col-span-2">
            <Checkbox
              id="secretary-is-nexus"
              checked={form.secretaryIsNexus}
              onCheckedChange={handleCheckboxChange('secretaryIsNexus')}
            />
            <Label htmlFor="secretary-is-nexus" className="text-sm font-normal">
              I would like Nexus Ventures to act as my company secretary and/or provide registered office services.
            </Label>
          </div>
          {!form.secretaryIsNexus && (
            <>
              <div>
                <Label>Secretary's Full Name</Label>
                <Input value={form.secretaryName} onChange={handleChange('secretaryName')} autoCapitalize="words" />
                {fieldErrors.secretaryName && <p className="text-sm text-red-600 mt-1">{fieldErrors.secretaryName}</p>}
              </div>
              <div>
                <Label>Secretary's Date of Birth</Label>
                <Input type="date" value={form.secretaryDob} onChange={handleChange('secretaryDob')} />
                {fieldErrors.secretaryDob && <p className="text-sm text-red-600 mt-1">{fieldErrors.secretaryDob}</p>}
              </div>
              <div className="md:col-span-2">
                <Label>Secretary's Address</Label>
                <Textarea value={form.secretaryAddress} onChange={handleChange('secretaryAddress')} autoCapitalize="words" />
                {fieldErrors.secretaryAddress && <p className="text-sm text-red-600 mt-1">{fieldErrors.secretaryAddress}</p>}
              </div>
              <div>
                <Label>Secretary's Telephone Number</Label>
                <Input value={form.secretaryPhone} onChange={handleChange('secretaryPhone')} autoCapitalize="off" />
                {fieldErrors.secretaryPhone && <p className="text-sm text-red-600 mt-1">{fieldErrors.secretaryPhone}</p>}
              </div>
              <div>
                <Label>Secretary's Email</Label>
                <Input type="email" value={form.secretaryEmail} onChange={handleChange('secretaryEmail')} autoCapitalize="off" />
                {fieldErrors.secretaryEmail && <p className="text-sm text-red-600 mt-1">{fieldErrors.secretaryEmail}</p>}
              </div>
              <div>
                <Label>Secretary's Nationality</Label>
                <Input value={form.secretaryNationality} onChange={handleChange('secretaryNationality')} autoCapitalize="words" />
                {fieldErrors.secretaryNationality && <p className="text-sm text-red-600 mt-1">{fieldErrors.secretaryNationality}</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Company Ownership</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Add each shareholder along with their ownership percentage.</p>
            <p className={`text-sm font-medium mt-1 ${ownershipTotalExceeds100 ? 'text-red-600' : ''}`}>
              Total ownership: {ownershipShareTotal.toFixed(2)}%
            </p>
            {fieldErrors.ownershipTotal && <p className="text-sm text-red-600 mt-1">{fieldErrors.ownershipTotal}</p>}
          </div>

          <div className="space-y-6">
            {owners.map((owner, index) => (
              <div key={`owner-${index}`} className="rounded-xl border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Owner {index + 1}</p>
                    <p className="text-sm text-muted-foreground">Shareholder details</p>
                  </div>
                  {owners.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeOwner(index)}>
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={owner.fullName} onChange={handleOwnerChange(index, 'fullName')} autoCapitalize="words" />
                    {fieldErrors[ownerErrorKey(index, 'fullName')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[ownerErrorKey(index, 'fullName')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Input value={owner.nationality} onChange={handleOwnerChange(index, 'nationality')} autoCapitalize="words" />
                    {fieldErrors[ownerErrorKey(index, 'nationality')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[ownerErrorKey(index, 'nationality')]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Share Percentage</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={owner.sharePercentage}
                      onChange={handleOwnerChange(index, 'sharePercentage')}
                    />
                    {fieldErrors[ownerErrorKey(index, 'sharePercentage')] && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors[ownerErrorKey(index, 'sharePercentage')]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addOwner}>
            Add another owner
          </Button>
          {fieldErrors.ownersCount && <p className="text-sm text-red-600">{fieldErrors.ownersCount}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Share Capital</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={shareOption === '100'} onChange={() => setShareOption('100')} />
              €100
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={shareOption === 'other'} onChange={() => setShareOption('other')} />
              Other Amount
            </label>
            {shareOption === 'other' && (
              <Input
                type="number"
                min="0"
                step="0.01"
                className="w-40"
                value={otherAmount}
                onChange={(event) => setOtherAmount(event.target.value)}
              />
            )}
          </div>
          {fieldErrors.otherAmount && <p className="text-sm text-red-600 mt-2">{fieldErrors.otherAmount}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Final Confirmation</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Checkbox id="confirm-proceed" checked={confirmProceed} onCheckedChange={(checked) => setConfirmProceed(Boolean(checked))} />
            <Label htmlFor="confirm-proceed" className="text-sm font-normal">
              I wish to proceed with the incorporation and accept the payment commitment of €399 + 23% VAT (€490.77)?
            </Label>
          </div>
          {fieldErrors.confirmProceed && <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmProceed}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="signatureDate">Date of signing</Label>
              <Input id="signatureDate" type="date" value={signatureDate} onChange={(e) => setSignatureDate(e.target.value)} />
              {fieldErrors.signatureDate && <p className="text-sm text-red-600 mt-1">{fieldErrors.signatureDate}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="signature">Signature(s)</Label>
              <SignaturePad accepted={Boolean(signatureData)} onChange={(data) => setSignatureData(data)} width={600} height={160} />
              {fieldErrors.signatureData && <p className="text-sm text-red-600 mt-1">{fieldErrors.signatureData}</p>}
              {signatureData && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Signature preview</div>
                  <div className="signature-preview">
                    <img title="Accepted signature preview" src={signatureData} alt="signature preview" className="border rounded" style={{ maxWidth: 300 }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <FormActions onSubmit={() => handleSubmit()} isSubmitting={submitting} submitLabel="Submit" />
        </CardFooter>
      </Card>
    </form>
  );
};

export default CompanyIncorporationForm;
