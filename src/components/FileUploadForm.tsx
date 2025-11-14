import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

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
  const [existingAmlRecord, setExistingAmlRecord] = useState<any | null>(null);
  const [existingPassportFiles, setExistingPassportFiles] = useState<string[]>([]);
  const [existingProofFiles, setExistingProofFiles] = useState<string[]>([]);
  const [existingRecordLoaded, setExistingRecordLoaded] = useState(false);
  const [existingFiles, setExistingFiles] = useState<Record<string, string[]>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassportFile(e.target.files?.[0] ?? null);
  };



  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofFile(e.target.files?.[0] ?? null);
  };

  const openPreview = (url: string, mime?: string | null, name?: string | null, isObjectUrl = false) => {
    setPreviewUrl(url);
    setPreviewMime(mime ?? (url.endsWith('.pdf') ? 'application/pdf' : url.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image/*' : null));
    setPreviewName(name ?? null);
    setPreviewOpen(true);
    if (isObjectUrl) setObjectUrl(url);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
    setPreviewMime(null);
    setPreviewName(null);
    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch (e) {}
      setObjectUrl(null);
    }
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

  // Normalize various incoming date formats (ISO, timestamp, or yyyy-MM-dd) to the
  // HTML date input format yyyy-MM-dd which PocketBase expects for date fields.
  const formatToDateInput = (v: any) => {
    if (!v) return '';
    const s = String(v).trim();
    // already in yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // try parsing as Date
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    // fallback: take first 10 chars
    return s.slice(0, 10);
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
  if (dobVal && !dob) setDob(formatToDateInput(dobVal));
        if (compName && !companyName) setCompanyName(compName);
  if (compCRO && !companyCRO) setCompanyCRO(compCRO);

        setProfileLoaded(true);
        // after loading profile, attempt to fetch any existing AML application for this user
        try {
          const currentUserId = (pb.authStore as any)?.model?.id ?? (user as any)?.id ?? '';
          if (currentUserId) {
            try {
              const list = await pb.collection('aml_applications').getList(1, 1, {
                filter: `user = "${currentUserId}"`,
                sort: '-created',
              });
              if (list && list.items && list.items.length > 0) {
                const aml = list.items[0];
                // Populate form fields with existing aml data if empty
                // Overwrite form fields with the latest AML record values so the user edits
                // the most recent submission by default.
                setFullName(aml.full_name ?? '');
                setEmail(aml.email ?? '');
                setPhone(aml.phone ?? '');
                setAddress(aml.address ?? '');
                setClientType(aml.client_type === 'company' ? 'company' : 'individual');
                setNationality(aml.nationality ?? '');
                setDob(aml.date_of_birth ? formatToDateInput(aml.date_of_birth) : '');
                setCompanyIncorpDate(aml.date_of_incorporation ? formatToDateInput(aml.date_of_incorporation) : '');
                setCompanyName(aml.company_name ?? '');
                setCompanyCRO(aml.company_cro ?? '');
                setActivityDescription(aml.activity_description ?? '');
                setConsent(Boolean(aml.consent));

                // Files: detect any file-array fields on the record (PocketBase stores file fields as arrays of filenames)
                const filesMap: Record<string, string[]> = {};
                for (const k of Object.keys(aml)) {
                  const v = (aml as any)[k];
                  // If field is an array of strings, treat as file list
                  if (Array.isArray(v) && v.length > 0 && v.every((x: any) => typeof x === 'string')) {
                    filesMap[k] = v as string[];
                    continue;
                  }
                  // Some PocketBase setups store a single filename as a string (not array).
                  // Detect likely file fields by key name or by value looking like a filename/URL.
                  if (typeof v === 'string' && v.trim().length > 0) {
                    const key = k.toLowerCase();
                    const looksLikeFilename = /\.[a-z0-9]{2,5}(?:\?|$)/i.test(v) || v.length < 255 && v.includes('.');
                    if (key.includes('passport') || key.includes('proof') || key.includes('file') || key.includes('attachment') || looksLikeFilename) {
                      filesMap[k] = [v as string];
                    }
                  }
                }
                setExistingFiles(filesMap);
                // keep legacy named lists for compatibility
                const passportFiles: string[] = filesMap['passport'] ?? filesMap['passport_files'] ?? filesMap['passport[]'] ?? [];
                const proofFiles: string[] = filesMap['proof_of_address'] ?? filesMap['proof'] ?? [];
                setExistingPassportFiles(passportFiles);
                setExistingProofFiles(proofFiles);
                setExistingAmlRecord(aml ?? null);
                setExistingRecordLoaded(true);
              }
            } catch (e) {
              // ignore fetch error — non-critical
            }
          }
        } catch (e) {
          // ignore
        }
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

      // Use the field IDs expected by the PocketBase collection (snake_case)
      formData.append('full_name', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('client_type', clientType);
      formData.append('nationality', nationality);
      if (clientType === 'individual') {
        formData.append('date_of_birth', formatToDateInput(dob));
      } else {
        formData.append('date_of_incorporation', formatToDateInput(companyIncorpDate));
      }
      formData.append('company_name', companyName);
      formData.append('company_cro', companyCRO);
      formData.append('activity_description', activityDescription);
      formData.append('consent', consent ? '1' : '0');

      if (passportFile) formData.append('passport', passportFile, passportFile.name);
      if (proofFile) formData.append('proof_of_address', proofFile, proofFile.name);

  // user authentication will be validated below and appended to the FormData

  // Ensure the relation field 'user' is set — the collection schema requires it
  const currentUserId = (pb.authStore.model as any)?.id ?? (user as any)?.id ?? '';
  // Avoid logging sensitive ids in production; keep only minimal debug when needed
  if (!currentUserId) throw new Error('You must be signed in to submit the form');
  // For relation fields (maxSelect:1) PocketBase accepts the related record id as the field value
  formData.append('user', currentUserId);

        // Create or update the record directly with the PocketBase client as the authenticated user
        // The SDK will attach the user's auth token automatically from pb.authStore
        let resp: any = null;
        if (existingAmlRecord && existingAmlRecord.id) {
          // Update existing record (only append file fields if new files selected)
          resp = await pb.collection('aml_applications').update(existingAmlRecord.id, formData);
        } else {
          // Ensure the relation field 'user' is set for new records
          formData.append('user', currentUserId);
          resp = await pb.collection('aml_applications').create(formData);
        }

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
      // Notify server to send admin email with uploaded documents
      try {
        const recordId = (resp && (resp.record?.id ?? resp.id)) || null;
        if (recordId) {
          // fire-and-forget; server will log and return status if needed
          fetch('/api/send-aml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordId }),
          }).catch((e) => {
            // don't surface to user, but log for debugging
            // eslint-disable-next-line no-console
            console.warn('Failed to notify server for admin email:', e?.message ?? e);
          });
        }
      } catch (e) {
        // ignore notification errors
      }
    } catch (err: any) {
  // Avoid logging full error objects which may contain sensitive data (tokens/ids).
  console.error('Submit failed', err?.message ?? String(err));

      // PocketBase validation errors are usually returned in err.response.data.data
      const respData = err?.response?.data ?? err?.data ?? null;
      if (respData && respData.data && typeof respData.data === 'object') {
        const pbToField: Record<string, string> = {
          full_name: 'fullName',
          email: 'email',
          phone: 'phone',
          address: 'address',
          client_type: 'clientType',
          nationality: 'nationality',
          date_of_birth: 'date',
          date_of_incorporation: 'incorp',
          company_name: 'company',
          company_cro: 'company',
          activity_description: 'activityDescription',
          passport: 'passport',
          proof_of_address: 'proof',
          consent: 'consent',
        };

        const mappedErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(respData.data)) {
          const msg = Array.isArray(v) ? v.join(', ') : String(v);
          const fieldKey = pbToField[k] ?? k;
          mappedErrors[fieldKey] = msg;
        }

        setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
        setError(respData?.raw ?? 'Validation failed');
      } else {
        setError(err?.message ?? err?.error ?? 'Submission failed');
      }
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
          {existingRecordLoaded && existingAmlRecord && (
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="text-sm font-medium">Previously submitted AML application</div>
              <div className="text-sm text-muted-foreground">Showing your most recent submission — fields are editable and you may re-upload files to replace existing ones.</div>
              <div className="mt-2 text-sm">
                <div><strong>Submitted:</strong> {new Date(existingAmlRecord.created || existingAmlRecord.createdAt || Date.now()).toLocaleString()}</div>
              </div>
            </div>
          )}

          

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
              {fieldErrors.clientType && <div className="text-sm text-red-600 mt-1">{fieldErrors.clientType}</div>}
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
              <Input type="file" accept="image/*,application/pdf" onChange={(e)=>{handlePassportChange(e); const file = e.target.files?.[0]; if (file) openPreview(URL.createObjectURL(file), file.type, file.name, true); }} {...{ capture: 'environment' } as any} />
              {passportFile && <div className="text-sm mt-1">Selected: {passportFile.name} <button type="button" className="ml-2 text-sm text-primary underline" onClick={() => passportFile && openPreview(URL.createObjectURL(passportFile), passportFile.type, passportFile.name, true)}>Preview</button></div>}
              {fieldErrors.passport && <div className="text-sm text-red-600 mt-1">{fieldErrors.passport}</div>}
            </div>
            <div>
              <Label>Proof of address (required)</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e)=>{handleProofChange(e); const file = e.target.files?.[0]; if (file) openPreview(URL.createObjectURL(file), file.type, file.name, true); }} {...{ capture: 'environment' } as any} />
              {proofFile && <div className="text-sm mt-1">Selected: {proofFile.name} <button type="button" className="ml-2 text-sm text-primary underline" onClick={() => proofFile && openPreview(URL.createObjectURL(proofFile), proofFile.type, proofFile.name, true)}>Preview</button></div>}
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
      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={(v) => { if (!v) closePreview(); setPreviewOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewName ?? 'Preview file'}</DialogTitle>
            <DialogDescription>{previewMime}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewUrl && previewMime && previewMime.includes('image') && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={previewName ?? 'preview'} className="max-h-[60vh] mx-auto" />
            )}
            {previewUrl && (!previewMime || previewMime === 'application/pdf' || previewUrl.endsWith('.pdf')) && (
              <div className="w-full flex justify-center">
                <iframe
                  src={previewUrl}
                  title={previewName ?? 'pdf-preview'}
                  className="h-[70vh]"
                  style={{ width: '100%', maxWidth: 'min(1200px, 95vw)', border: 'none' }}
                />
              </div>
            )}
            {!previewUrl && <div>No preview available</div>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => closePreview()}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FileUploadForm;
