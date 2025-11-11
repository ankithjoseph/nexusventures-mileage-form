import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
  onComplete?: (record: any) => void;
};

const FileUploadForm: React.FC<Props> = ({ onComplete }) => {
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [clientType, setClientType] = useState<'individual' | 'company'>('individual');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [companyIncorpDate, setCompanyIncorpDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCRO, setCompanyCRO] = useState('');
  const [activityDescription, setActivityDescription] = useState('');

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassportFile(e.target.files?.[0] ?? null);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofFile(e.target.files?.[0] ?? null);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName) errors.fullName = 'Full name is required';
    if (!email) errors.email = 'Email is required';
    if (!phone) errors.phone = 'Phone is required';
    if (!address) errors.address = 'Address is required';
    if (!nationality) errors.nationality = 'Nationality is required';
    if (clientType === 'individual' && !dob) errors.date = 'Date of birth is required for individuals';
    if (clientType === 'company' && (!companyName || !companyCRO)) errors.company = 'Company name and CRO are required for companies';
    if (clientType === 'company' && !companyIncorpDate) errors.incorp = 'Date of incorporation is required for companies';
    if (!passportFile) errors.passport = 'Passport file is required';
    if (!proofFile) errors.proof = 'Proof of address is required';
    if (!consent) errors.consent = 'You must confirm and authorize usage for AML compliance';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0 ? null : 'validation_error';
  };

  // Load current user's profile and prefill fields when available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const authModel = (pb.authStore as any)?.model ?? (user as any) ?? null;
        let record = authModel;
        // If we only have an id, fetch the full user record
        if (authModel && typeof authModel === 'object' && authModel?.id && Object.keys(authModel).length <= 2) {
          try {
            record = await pb.collection('users').getOne((authModel as any).id);
          } catch (e) {
            // ignore fetch error and continue with authModel
            record = authModel;
          }
        }

        if (!mounted || !record) return;

        // Flexible mapping from common user profile fields
        const map = (keyCandidates: string[]) => {
          for (const k of keyCandidates) {
            if ((record as any)[k]) return (record as any)[k] as string;
          }
          return '';
        };

        const name = map(['name', 'full_name', 'fullName', 'displayName']);
        const mail = map(['email', 'emailAddress', 'email_address']);
        const ph = map(['phone', 'telephone', 'mobile']);
        const addr = map(['address', 'street', 'address_line']);
        const nat = map(['nationality', 'country']);
        const dobVal = map(['dob', 'date_of_birth', 'birth_date']);
        const compName = map(['company_name', 'company', 'organisation', 'organization']);
        const compCRO = map(['company_cro', 'cro', 'companyNumber']);

        // Only set state if field is empty to avoid overwriting any user edits
        if (name && !fullName) setFullName(name);
        if (mail && !email) setEmail(mail);
        if (ph && !phone) setPhone(ph);
        if (addr && !address) setAddress(addr);
        if (nat && !nationality) setNationality(nat);
        if (dobVal && !dob) setDob(dobVal);
        if (compName && !companyName) setCompanyName(compName);
        if (compCRO && !companyCRO) setCompanyCRO(compCRO);

        setProfileLoaded(true);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);

    // per-file validation
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (passportFile) {
      if (passportFile.size > maxSizeBytes) return setError('Passport file is too large (max 10MB)');
      if (!allowedTypes.includes(passportFile.type)) return setError('Passport file must be PNG, JPG or PDF');
    }
    if (proofFile) {
      if (proofFile.size > maxSizeBytes) return setError('Proof of address file is too large (max 10MB)');
      if (!allowedTypes.includes(proofFile.type)) return setError('Proof of address must be PNG, JPG or PDF');
    }

  setLoading(true);
  setUploadProgress(0);
    try {
      const formData = new FormData();
      // use camelCase keys that the server expects
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('clientType', clientType);
      formData.append('nationality', nationality);
      if (clientType === 'individual') {
        formData.append('dob', dob);
      } else {
        formData.append('companyIncorpDate', companyIncorpDate);
      }
      formData.append('companyName', companyName);
      formData.append('companyCRO', companyCRO);
      formData.append('activityDescription', activityDescription);
      formData.append('consent', consent ? '1' : '0');

      const userId = (pb.authStore.model as any)?.id ?? (user as any)?.id ?? '';
      if (!userId) throw new Error('No authenticated user found');
      formData.append('user', userId);

      if (passportFile) formData.append('passport', passportFile, passportFile.name);
      if (proofFile) formData.append('proof_of_address', proofFile, proofFile.name);

      // Use XHR to track upload progress and post to our server endpoint which will use an admin token
      const uploadWithProgress = (fd: FormData, onProgress: (p: number) => void) => {
        return new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/aml-submit');
          // Attach the user's PocketBase token so the server can create the record as that user
          try {
            const token = (pb.authStore as any)?.token;
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          } catch (e) {
            // ignore
          }
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const percent = Math.round((ev.loaded / ev.total) * 100);
              onProgress(percent);
            }
          };
          xhr.onload = () => {
            try {
              const json = JSON.parse(xhr.responseText || '{}');
              if (xhr.status >= 200 && xhr.status < 300) resolve(json);
              else reject(json);
            } catch (e) {
              reject({ error: 'Invalid server response' });
            }
          };
          xhr.onerror = () => reject({ error: 'Network error' });
          xhr.send(fd);
        });
      };

  const resp = await uploadWithProgress(formData, (p) => setUploadProgress(p));

      // reset form on success
      setFullName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setClientType('individual');
      setNationality('');
      setDob('');
      setCompanyName('');
      setCompanyCRO('');
      setActivityDescription('');
      setPassportFile(null);
      setProofFile(null);
      setConsent(false);
  setUploadProgress(0);

      onComplete?.(resp.record ?? resp);
    } catch (err: any) {
      console.error('Submit failed', err);
      setError(err?.message ?? err?.error ?? 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
  <Card className="w-full max-w-3xl mx-auto">
      <CardHeader />
      <CardContent>
  <form id="aml-form" onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {profileLoaded && <div className="text-sm text-muted-foreground">Loaded your saved profile details — edit if needed.</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              {fieldErrors.fullName && <div className="text-sm text-red-600 mt-1">{fieldErrors.fullName}</div>}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email && <div className="text-sm text-red-600 mt-1">{fieldErrors.email}</div>}
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              {fieldErrors.phone && <div className="text-sm text-red-600 mt-1">{fieldErrors.phone}</div>}
            </div>
            <div>
              <Label>Nationality</Label>
              <Input value={nationality} onChange={(e) => setNationality(e.target.value)} />
              {fieldErrors.nationality && <div className="text-sm text-red-600 mt-1">{fieldErrors.nationality}</div>}
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
              {fieldErrors.address && <div className="text-sm text-red-600 mt-1">{fieldErrors.address}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Type of client</Label>
              <select className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={clientType} onChange={(e) => setClientType(e.target.value as any)}>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <Label>{clientType === 'individual' ? 'Date of birth (for individuals)' : 'Date of incorporation (for companies)'}</Label>
              <Input type="date" value={clientType === 'individual' ? dob : companyIncorpDate} onChange={(e) => clientType === 'individual' ? setDob(e.target.value) : setCompanyIncorpDate(e.target.value)} />
              {fieldErrors.date && <div className="text-sm text-red-600 mt-1">{fieldErrors.date}</div>}
            </div>
          </div>

          {clientType === 'company' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <Label>Company CRO</Label>
                <Input value={companyCRO} onChange={(e) => setCompanyCRO(e.target.value)} />
                {fieldErrors.company && <div className="text-sm text-red-600 mt-1">{fieldErrors.company}</div>}
              </div>
            </div>
          )}

          <div>
            <Label>Short description of activity</Label>
            <Textarea value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Passport (required)</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={handlePassportChange} {...{ capture: 'environment' } as any} />
              {passportFile && <div className="text-sm mt-1">Selected: {passportFile.name}</div>}
              {fieldErrors.passport && <div className="text-sm text-red-600 mt-1">{fieldErrors.passport}</div>}
            </div>
            <div>
              <Label>Proof of address (required)</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={handleProofChange} {...{ capture: 'environment' } as any} />
              {proofFile && <div className="text-sm mt-1">Selected: {proofFile.name}</div>}
              {fieldErrors.proof && <div className="text-sm text-red-600 mt-1">{fieldErrors.proof}</div>}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
            <label htmlFor="consent" className="text-sm">I confirm the information is true and authorize Irish Tax Agents to use it for AML compliance.</label>
          </div>
          {fieldErrors.consent && <div className="text-sm text-red-600 mt-1">{fieldErrors.consent}</div>}

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-100 rounded h-2 mt-3">
              <div className="h-2 bg-primary rounded" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          

        </form>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <Button type="submit" form="aml-form" disabled={loading}>{loading ? 'Submitting…' : 'Submit'}</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FileUploadForm;
