import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import ThankYouDialog from '@/components/ThankYouDialog';
import { Badge } from '@/components/ui/badge';

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
  const [passportIsExisting, setPassportIsExisting] = useState(false);
  const [proofIsExisting, setProofIsExisting] = useState(false);

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
  const [existingFilesAttached, setExistingFilesAttached] = useState(false);

  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [lastAmlRecordId, setLastAmlRecordId] = useState<string | null>(null);


  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPassportIsExisting(false);
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/heic', 'image/heif', 'application/pdf'];

    if (!file) {
      setPassportFile(null);
      // clear any passport-specific field error
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.passport;
        return copy;
      });
      return true;
    }

    if (file.size > maxSizeBytes) {
      setPassportFile(null);
      setFieldErrors((prev) => ({ ...prev, passport: 'Passport file is too large (max 10MB)' }));
      return false;
    }

    // Some browsers/OS (especially iOS camera) may not set a MIME type for HEIC/HEIF or photos; fall back to extension check
    const fname = file.name || '';
    const extOk = /\.(png|jpe?g|heic|heif|pdf)$/i.test(fname);
    if (!allowedTypes.includes(file.type) && !extOk) {
      setPassportFile(null);
      setFieldErrors((prev) => ({ ...prev, passport: 'Passport file must be PNG, JPG, HEIC/HEIF or PDF' }));
      return false;
    }

    // accepted
    setPassportFile(file);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.passport;
      return copy;
    });
    return true;
  };

  // When an existing AML record is present, attach stored files as File objects
  // to the form state so they are included in FormData on submit if the user
  // doesn't choose replacements.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!existingAmlRecord || existingFilesAttached) return;
      try {
        // attach passport
        if (!passportFile && existingPassportFiles && existingPassportFiles.length > 0) {
          const fname = existingPassportFiles[0];
          try {
            const blob = await fetchFileBlob('aml_applications', existingAmlRecord.id, fname);
            if (mounted && blob) {
              try {
                const f = new File([blob], fname, { type: blob.type || 'application/octet-stream' });
                setPassportFile(f);
                setPassportIsExisting(true);
              } catch (e) {
                // ignore file creation errors
              }
            }
          } catch (e) {
            console.warn('[FileFetch] failed to attach passport', e);
          }
        }

        // attach proof
        if (!proofFile && existingProofFiles && existingProofFiles.length > 0) {
          const fname = existingProofFiles[0];
          try {
            const blob = await fetchFileBlob('aml_applications', existingAmlRecord.id, fname);
            if (mounted && blob) {
              try {
                const f = new File([blob], fname, { type: blob.type || 'application/octet-stream' });
                setProofFile(f);
                setProofIsExisting(true);
              } catch (e) {
                // ignore file creation errors
              }
            }
          } catch (e) {
            console.warn('[FileFetch] failed to attach proof', e);
          }
        }
      } catch (e) {
        // attach existing files failed silently
      } finally {
        if (mounted) setExistingFilesAttached(true);
      }
    })();
    return () => { mounted = false; };
  }, [existingAmlRecord, existingPassportFiles, existingProofFiles, existingFilesAttached]);

  // Helper to fetch a file blob via our server proxy and return it
  const fetchFileBlob = async (collection: string, recordId: string, filename: string): Promise<Blob | null> => {
    try {
      const token = (pb.authStore as any)?.token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch('/api/pb-file', { method: 'POST', headers, body: JSON.stringify({ collection, recordId, filename }) });
      if (!resp.ok) return null;
      return await resp.blob();
    } catch (e) {
      return null;
    }
  };



  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProofIsExisting(false);
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/heic', 'image/heif', 'application/pdf'];

    if (!file) {
      setProofFile(null);
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.proof;
        return copy;
      });
      return true;
    }

    if (file.size > maxSizeBytes) {
      setProofFile(null);
      setFieldErrors((prev) => ({ ...prev, proof: 'Proof of address file is too large (max 10MB)' }));
      return false;
    }

    // Some browsers/OS may not set a MIME type for HEIC/HEIF; fall back to extension check
    const pfname = file.name || '';
    const pfExtOk = /\.(png|jpe?g|heic|heif|pdf)$/i.test(pfname);
    if (!allowedTypes.includes(file.type) && !pfExtOk) {
      setProofFile(null);
      setFieldErrors((prev) => ({ ...prev, proof: 'Proof of address must be PNG, JPG, HEIC/HEIF or PDF' }));
      return false;
    }

    setProofFile(file);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.proof;
      return copy;
    });
    return true;
  };

  // Show preview using SweetAlert2. Accepts a Blob (File) or a URL string.
  const showPreviewSwal = (source: Blob | string, name?: string | null, mime?: string | null) => {
    let url = '';
    let createdObjectUrl = false;
    try {
      if (typeof source === 'string') {
        url = source;
      } else {
        url = URL.createObjectURL(source);
        createdObjectUrl = true;
        mime = mime || (source as Blob).type || mime;
      }

      const isImage = !!(mime && mime.startsWith('image')) || /\.(jpg|jpeg|png|gif)$/i.test(name || '');
      const isPdf = (mime === 'application/pdf') || (name || '').toLowerCase().endsWith('.pdf') || url.toLowerCase().endsWith('.pdf');

      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      container.style.padding = '0';

      if (isImage) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = name || 'preview';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '70vh';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        container.appendChild(img);
      } else if (isPdf) {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = name || 'pdf-preview';
        iframe.style.width = '100%';
        iframe.style.height = '70vh';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.style.margin = '0 auto';
        container.appendChild(iframe);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = name || 'Open file';
        container.appendChild(link);
      }

      Swal.fire({
        title: name ?? 'Preview file',
        html: container,
        showConfirmButton: true,
        confirmButtonText: 'Accept',
        showCloseButton: false,
        width: '90%',
        customClass: {
          popup: 'max-w-[95vw]',
          // reduce title size to better fit mobile
          title: 'text-sm sm:text-base',
          // match shadcn Button default variant styling
          confirmButton: 'w-full sm:w-auto py-2 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md',
        },
        didClose: () => {
          if (createdObjectUrl) {
            try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
          }
        }
      });
    } catch (err) {
      // fallback: open in new tab
      try {
        const fallbackUrl = typeof source === 'string' ? source : '';
        if (fallbackUrl) window.open(fallbackUrl, '_blank', 'noopener');
      } catch (e) { /* ignore */ }
    }
  };


  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName) errors.fullName = 'Full name is required';
    if (!email) errors.email = 'Email is required';
    if (!phone) errors.phone = 'Phone is required';
    if (!address) errors.address = 'Address is required';
    if (!nationality) errors.nationality = 'Nationality is required';
    if (clientType === 'individual' && !dob) errors.date = 'Date of birth is required';
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
                // clientType is always individual now
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
                // debug: log that we found an existing AML record and file keys (non-sensitive)
                // Found existing AML record; internal state populated (no verbose logging)
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

  // Helper to (re)load the latest AML application from the server for the
  // currently authenticated user and populate form state. Used after a
  // successful submit when the user closes the thank-you dialog.
  const reloadLatestAml = async () => {
    try {
      const currentUserId = (pb.authStore as any)?.model?.id ?? (user as any)?.id ?? '';
      if (!currentUserId) return;
      const list = await pb.collection('aml_applications').getList(1, 1, {
        filter: `user = "${currentUserId}"`,
        sort: '-created',
      });
      if (!list || !list.items || list.items.length === 0) return;
      const aml = list.items[0];

      // Populate form with server values
      setFullName(aml.full_name ?? '');
      setEmail(aml.email ?? '');
      setPhone(aml.phone ?? '');
      setAddress(aml.address ?? '');
      // clientType is always individual now
      setNationality(aml.nationality ?? '');
      setDob(aml.date_of_birth ? formatToDateInput(aml.date_of_birth) : '');
      setCompanyIncorpDate(aml.date_of_incorporation ? formatToDateInput(aml.date_of_incorporation) : '');
      setCompanyName(aml.company_name ?? '');
      setCompanyCRO(aml.company_cro ?? '');
      setActivityDescription(aml.activity_description ?? '');
      setConsent(Boolean(aml.consent));

      // detect file fields as before
      const filesMap: Record<string, string[]> = {};
      for (const k of Object.keys(aml)) {
        const v = (aml as any)[k];
        if (Array.isArray(v) && v.length > 0 && v.every((x: any) => typeof x === 'string')) {
          filesMap[k] = v as string[];
          continue;
        }
        if (typeof v === 'string' && v.trim().length > 0) {
          const key = k.toLowerCase();
          const looksLikeFilename = /\.[a-z0-9]{2,5}(?:\?|$)/i.test(v) || v.length < 255 && v.includes('.');
          if (key.includes('passport') || key.includes('proof') || key.includes('file') || key.includes('attachment') || looksLikeFilename) {
            filesMap[k] = [v as string];
          }
        }
      }

      setExistingFiles(filesMap);
      const passportFiles: string[] = filesMap['passport'] ?? filesMap['passport_files'] ?? filesMap['passport[]'] ?? [];
      const proofFiles: string[] = filesMap['proof_of_address'] ?? filesMap['proof'] ?? [];
      setExistingPassportFiles(passportFiles);
      setExistingProofFiles(proofFiles);
      setExistingAmlRecord(aml ?? null);
      setExistingRecordLoaded(true);

      // reset attachment flags so the attachment effect will re-run and attach
      // the server-provided blobs as File objects
      setExistingFilesAttached(false);
      setPassportIsExisting(false);
      setProofIsExisting(false);
      setPassportFile(null);
      setProofFile(null);
    } catch (e) {
      // non-fatal
      console.error('Failed to reload latest AML', e);
    }
  };

  // Helper to construct a file URL for files stored on PocketBase
  const fileUrl = (collection: string, recordId: string, filename: string) => {
    try {
      // pb.baseUrl is the configured PocketBase url (e.g. https://...)
      const base = (pb as any).baseUrl || (pb as any).client?.baseUrl || '';
      if (base) return `${base.replace(/\/$/, '')}/api/files/${collection}/${recordId}/${encodeURIComponent(filename)}`;
      // fallback to PocketBase SDK helper if available
      if (typeof (pb as any).getFileUrl === 'function') return (pb as any).getFileUrl({ collectionId: collection, id: recordId } as any, filename);
    } catch (e) {
      // ignore
    }
    return '';
  };

  // Fetch file using a PocketBase file token to access protected files.
  // Uses pb.files.getToken() and pb.files.getURL(record, filename, { token }) when available.
  const fetchAndOpenFile = async (collection: string, recordId: string, filename: string) => {
    // Ensure we have a valid auth session. If token expired try to refresh it so
    // pb.files.getToken() will succeed with the current user's credentials.
    try {
      let authToken = (pb.authStore as any)?.token;
      if (!authToken) {
        try {
          await pb.collection('users').authRefresh();
        } catch (_) { }
        authToken = (pb.authStore as any)?.token;
      }
      if (!authToken) {
        window.location.href = '/login';
        return;
      }

      // Use server-side proxy endpoint to fetch and open the file
      try {
        const token = (pb.authStore as any)?.token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch('/api/pb-file', { method: 'POST', headers, body: JSON.stringify({ collection, recordId, filename }) });
        if (!resp.ok) {
          // fallback: open direct file URL (may fail due to permissions)
          const url = fileUrl(collection, recordId, filename);
          window.open(url, '_blank', 'noopener');
          return;
        }
        const blob = await resp.blob();
        showPreviewSwal(blob, filename, blob.type || undefined);
        return;
      } catch (err) {
        console.error('[FileFetch] server proxy fetch failed', err);
        const url = fileUrl(collection, recordId, filename);
        window.open(url, '_blank', 'noopener');
        return;
      }
    } catch (e) {
      // getToken failed — fall back to previous behavior using Authorization header
      const url = fileUrl(collection, recordId, filename);
      try {
        const token = (pb.authStore as any)?.token;
        const headers: Record<string, string> = {};
        if (!token) {
          // try refresh once more
          try { await pb.collection('users').authRefresh(); } catch (refreshErr) { console.warn('[FileFetch] fallback authRefresh failed', refreshErr); }
        }
        const finalToken = (pb.authStore as any)?.token;
        if (finalToken) headers['Authorization'] = `Bearer ${finalToken}`;
        const resp = await fetch(url, { headers });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        showPreviewSwal(blob, filename, blob.type || undefined);
        return;
      } catch (err) {
        console.error('[FileFetch] Authorization fallback failed', err);
        // If we got a 404, fetch the record from PocketBase and dump its file fields to the console
        try {
          const is404 = String(err).includes('404');
          if (is404) {
            try {
              const rec = await pb.collection(collection).getOne(recordId);
              // fetched record for 404 investigation (no verbose log)
            } catch (recErr) {
              // ignore
            }
          }
        } catch (logErr) {
          // ignore
        }

        if (url) {
          window.open(url, '_blank', 'noopener');
          return;
        }
      }
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);

    // per-file validation
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/heic', 'image/heif', 'application/pdf'];
    if (passportFile) {
      if (passportFile.size > maxSizeBytes) return setError('Passport file is too large (max 10MB)');
      // If file.type is not present, fall back to extension check
      const pName = passportFile.name || '';
      const pExtOk = /\.(png|jpe?g|heic|heif|pdf)$/i.test(pName);
      if (!allowedTypes.includes(passportFile.type) && !pExtOk) return setError('Passport file must be PNG, JPG, HEIC/HEIF or PDF');
    }
    if (proofFile) {
      if (proofFile.size > maxSizeBytes) return setError('Proof of address file is too large (max 10MB)');
      const prName = proofFile.name || '';
      const prExtOk = /\.(png|jpe?g|heic|heif|pdf)$/i.test(prName);
      if (!allowedTypes.includes(proofFile.type) && !prExtOk) return setError('Proof of address must be PNG, JPG, HEIC/HEIF or PDF');
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

      if (passportFile) {
        // rename uploaded passport file to a stable name while preserving extension
        const pExt = (passportFile.name && passportFile.name.includes('.')) ? passportFile.name.slice(passportFile.name.lastIndexOf('.')) : '';
        const passportFilename = `passport${pExt}`;
        formData.append('passport', passportFile, passportFilename);
      }
      if (proofFile) {
        // rename uploaded proof file to a stable name (address-proof) while preserving extension
        const prExt = (proofFile.name && proofFile.name.includes('.')) ? proofFile.name.slice(proofFile.name.lastIndexOf('.')) : '';
        const proofFilename = `address-proof${prExt}`;
        formData.append('proof_of_address', proofFile, proofFilename);
      }

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

      // do not clear the form immediately — keep values visible so the user can
      // verify what was submitted. We'll clear / reload after the user closes
      // the thank-you dialog (see handleThankYouClose below).
      setUploadProgress(0);
      const created = resp.record ?? resp;
      onComplete?.(created);
      // remember record id so we can notify admin when user closes thank-you dialog
      try {
        setLastAmlRecordId(created?.id ?? null);
      } catch (e) { }
      // show thank-you dialog
      setThankYouOpen(true);
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
    <Card className="container mx-auto px-4 py-8 max-w-4xl flex-1">
      <CardContent>
        <h1 className="text-2xl font-semibold mb-4 text-primary">AML Compliance Form</h1>
        <p className="text-sm text-muted-foreground mb-4">Provide the information and required documents for AML compliance.</p>

        <form id="aml-form" onSubmit={handleSubmit} className="space-y-6">
          {existingRecordLoaded && existingAmlRecord && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200">
              <div className="text-sm font-medium text-green-900">Previously submitted AML application</div>
              <div className="text-sm text-green-800">Showing your most recent submission — fields are editable and you may re-upload files to replace existing ones.</div>
              <div className="mt-2 text-sm text-green-900">
                <div><strong>Submitted:</strong> {new Date(existingAmlRecord.updated || existingAmlRecord.updatedAt || existingAmlRecord.created || existingAmlRecord.createdAt || Date.now()).toLocaleString('en-GB')}</div>
              </div>
            </div>
          )}

          {/* Personal information section */}
          <section className="bg-muted/20 p-4 rounded-md border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Personal information</h2>
              <Badge>Individual</Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </section>

          {/* Date of birth */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background p-4 rounded-md border">
              <Label>Date of birth</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              {fieldErrors.date && <div className="text-sm text-red-600 mt-1">{fieldErrors.date}</div>}
            </div>
          </section>

          <section>
            <Label>Profession</Label>
            <Textarea value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} />
          </section>

          {/* Documents section with modern file boxes */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-dashed border-input p-4 bg-background">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label className="mb-0">Passport (required)</Label>
                  <div className="text-xs text-muted-foreground">PNG, JPG, HEIC/HEIF or PDF. Max 10MB.</div>
                </div>
                {passportIsExisting && <Badge variant="outline">Available</Badge>}
              </div>
              <Input
                type="file"
                accept="image/*,application/pdf,.heic,.heif"
                onChange={(e) => { const file = e.target.files?.[0]; const ok = handlePassportChange(e); if (ok && file) showPreviewSwal(file, file.name, file.type); }}
              />
              <div className="mt-2 flex items-center gap-2">
                {passportFile && <button type="button" className="text-sm text-primary underline" onClick={() => passportFile && showPreviewSwal(passportFile, passportFile.name, passportFile.type)}>Preview</button>}
                {(!passportFile && existingPassportFiles && existingPassportFiles.length > 0 && existingAmlRecord) && (
                  <div className="text-sm">
                    Existing: {existingPassportFiles.map((f) => (
                      <span key={f} className="inline-flex items-center gap-2 mr-2">
                        <span className="truncate">{f}</span>
                        <button type="button" className="text-sm text-primary underline" onClick={() => void fetchAndOpenFile('aml_applications', existingAmlRecord.id, f)}>Preview</button>
                      </span>
                    ))}
                  </div>
                )}
                {fieldErrors.passport && <div className="text-sm text-red-600 mt-1">{fieldErrors.passport}</div>}
              </div>
            </div>

            <div className="rounded-md border border-dashed border-input p-4 bg-background">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label className="mb-0">Proof of address (required)</Label>
                  <div className="text-xs text-muted-foreground">PNG, JPG, HEIC/HEIF or PDF. Max 10MB.</div>
                </div>
                {proofIsExisting && <Badge variant="outline">Available</Badge>}
              </div>
              <Input
                type="file"
                accept="image/*,application/pdf,.heic,.heif"
                onChange={(e) => { const file = e.target.files?.[0]; const ok = handleProofChange(e); if (ok && file) showPreviewSwal(file, file.name, file.type); }}
              />
              <div className="mt-2 flex items-center gap-2">
                {proofFile && <button type="button" className="text-sm text-primary underline" onClick={() => proofFile && showPreviewSwal(proofFile, proofFile.name, proofFile.type)}>Preview</button>}
                {(!proofFile && existingProofFiles && existingProofFiles.length > 0 && existingAmlRecord) && (
                  <div className="text-sm">
                    Existing: {existingProofFiles.map((f) => (
                      <span key={f} className="inline-flex items-center gap-2 mr-2">
                        <span className="truncate">{f}</span>
                        <button type="button" className="text-sm text-primary underline" onClick={() => void fetchAndOpenFile('aml_applications', existingAmlRecord.id, f)}>Preview</button>
                      </span>
                    ))}
                  </div>
                )}
                {fieldErrors.proof && <div className="text-sm text-red-600 mt-1">{fieldErrors.proof}</div>}
              </div>
            </div>
          </section>

          <section className="bg-muted/10 p-3 rounded-md border">
            <p className="text-xs text-muted-foreground mb-3">
              The information provided is collected under our legal obligation to comply with Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations. Your data is transmitted securely to Nexus Ventures & Co. (TAIN 77706B) and retained for the period required by law.
            </p>
            <div className="flex items-start gap-3">
              <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
              <label htmlFor="consent" className="text-sm">I confirm the information is true and authorize Irish Tax Agents to use it for AML compliance.</label>
            </div>
            {fieldErrors.consent && <div className="text-sm text-red-600 mt-1">{fieldErrors.consent}</div>}
          </section>

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-100 rounded h-2 mt-3">
              <div className="h-2 bg-primary rounded" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

        </form>
      </CardContent>
      <CardFooter>
        <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2">
          <div>
            <Button type="submit" form="aml-form" disabled={loading}>{loading ? 'Submitting…' : 'Submit'}</Button>
          </div>
          <div>
            {error && <div className="text-sm text-red-600 sm:ml-3">{error}</div>}
          </div>
        </div>
      </CardFooter>
      {/* Preview handled by SweetAlert2 */}
      <ThankYouDialog
        open={thankYouOpen}
        onOpenChange={(v) => setThankYouOpen(v)}
        title="Thank you"
        description={
          'Your AML compliance form has been submitted. We will review the documents and contact you if anything else is required.'
        }
        primaryLabel="Close"
        onPrimary={async () => {
          // When the user confirms the thank-you dialog, first notify
          // the admin via server-side email with attached documents,
          // then reload the latest AML record to re-attach files.
          try {
            if (lastAmlRecordId) {
              // show loading modal
              Swal.fire({
                title: 'Submitting…',
                html: 'Submitting attached documents…',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
              });

              // Convert selected files (if any) to base64 and include in request
              const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                try {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    const parts = result.split(',');
                    resolve(parts.length > 1 ? parts[1] : result);
                  };
                  reader.onerror = (err) => reject(err);
                  reader.readAsDataURL(file);
                } catch (err) { reject(err); }
              });

              const filesPayload: Array<any> = [];
              try {
                if (passportFile) {
                  const b64 = await fileToBase64(passportFile);
                  const pExt = (passportFile.name && passportFile.name.includes('.')) ? passportFile.name.slice(passportFile.name.lastIndexOf('.')) : '';
                  const passportFilename = `passport${pExt}`;
                  filesPayload.push({ field: 'passport', filename: passportFilename, content: b64, type: passportFile.type || '' });
                }
                if (proofFile) {
                  const b64 = await fileToBase64(proofFile);
                  const prExt = (proofFile.name && proofFile.name.includes('.')) ? proofFile.name.slice(proofFile.name.lastIndexOf('.')) : '';
                  const proofFilename = `address-proof${prExt}`;
                  filesPayload.push({ field: 'proof_of_address', filename: proofFilename, content: b64, type: proofFile.type || '' });
                }
              } catch (err) {
                console.warn('Failed to read files for admin email', err);
              }

              // Include the current PocketBase auth token so the server
              // can fetch private files on behalf of the user when needed.
              const pbToken = (pb.authStore as any)?.token ?? '';
              const resp = await fetch('/api/send-aml', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(pbToken ? { Authorization: `Bearer ${pbToken}` } : {}) },
                body: JSON.stringify({ recordId: lastAmlRecordId, files: filesPayload }),
              });

              Swal.close();

              if (!resp.ok) {
                let data = null;
                try { data = await resp.json(); } catch (e) { /* ignore */ }
                await Swal.fire('Document Submission failed', data?.error ?? 'Server returned an error', 'error');
              } else {
                await Swal.fire('Submitted', 'Documents submitted successfully.', 'success');
              }
            }
          } catch (e) {
            try {
              Swal.close();
            } catch (er) { }
            await Swal.fire('Document Submission failed', 'Network error while submitting documents.', 'error');
          }

          // Reload latest AML (re-attaches server files) then close dialog
          try {
            await reloadLatestAml();
          } catch (e) {
            console.error('reloadLatestAml failed', e);
          }
          setThankYouOpen(false);
        }}
      />
    </Card>
  );
};

export default FileUploadForm;
