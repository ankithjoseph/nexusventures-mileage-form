import React, { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

// This component uses SweetAlert2 to display the modal when `open` becomes true.
// It renders nothing to the DOM — all UI is handled by SweetAlert2.
const ThankYouDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  title = 'Thank you',
  description = 'Your submission has been received.',
  primaryLabel = 'Close',
  onPrimary,
  secondaryLabel,
  onSecondary,
}) => {
  useEffect(() => {
    if (!open) return;

    (async () => {
      const result = await Swal.fire({
        title: String(title),
        html: typeof description === 'string' ? description : renderToStaticMarkup(<div>{description}</div>),
        icon: 'success',
        showCancelButton: Boolean(secondaryLabel),
        confirmButtonText: primaryLabel,
        cancelButtonText: secondaryLabel || 'Cancel',
        // prevent closing by clicking outside
        allowOutsideClick: false,
        customClass: {
          popup: 'rounded-lg shadow-lg',
          title: 'text-2xl font-semibold',
          htmlContainer: 'text-sm text-muted-foreground',
          confirmButton: 'swal2-confirm',
          cancelButton: 'swal2-cancel',
        },
        focusConfirm: true,
      });

      // Closed by confirm
      if (result.isConfirmed) {
        try { onPrimary?.(); } catch (e) { console.error(e); }
        onOpenChange(false);
        return;
      }

      // Closed by cancel button
      if (result.dismiss === Swal.DismissReason.cancel) {
        try { onSecondary?.(); } catch (e) { console.error(e); }
        onOpenChange(false);
        return;
      }

      // any other dismiss (click outside, esc) — just close
      onOpenChange(false);
    })();
  }, [open]);

  return null;
};

export default ThankYouDialog;
