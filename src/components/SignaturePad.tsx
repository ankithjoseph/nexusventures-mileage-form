import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import SignaturePadLib from 'signature_pad';

type SignaturePadProps = {
  onChange?: (dataUrl: string | null) => void;
  initialDataUrl?: string | null;
  width?: number;
  height?: number;
  /**
   * When true, the pad considers a signature already accepted and will hide the tip.
   * Parent should pass Boolean(acceptedSignatureData).
   */
  accepted?: boolean;
};

export type SignaturePadHandle = {
  /**
   * Returns a PNG data URL at requested scale multiplier (1 = native, 3 = 3x pixels)
   */
  getDataUrl: (scale?: number) => string | null;
  clear: () => void;
};

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(({ onChange, initialDataUrl = null, width = 600, height = 200, accepted = false }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);

    const sp = new SignaturePadLib(canvas as HTMLCanvasElement, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#111827',
      minWidth: 1.5,
      maxWidth: 2.5,
    });
    signaturePadRef.current = sp;

    const handleEnd = () => {
      // mark that the canvas has content, but do not auto-save.
      setHasContent(!sp.isEmpty());
    };

    // signature_pad doesn't expose a typed onEnd prop in its types; listen to pointer events on the canvas
    const canvasEl = canvas as HTMLCanvasElement;
    canvasEl.addEventListener('pointerup', handleEnd);
    canvasEl.addEventListener('pointercancel', handleEnd);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        sp.clear();
        const ctxLocal = canvas.getContext('2d');
        if (ctxLocal) {
          ctxLocal.drawImage(img, 0, 0, width, height);
          // mark as content but don't auto-accept; user must press Accept
          setHasContent(true);
        }
      };
      img.src = initialDataUrl;
    }

    return () => {
      const canvasEl = canvas as HTMLCanvasElement;
      canvasEl.removeEventListener('pointerup', handleEnd);
      canvasEl.removeEventListener('pointercancel', handleEnd);
      sp.clear();
      signaturePadRef.current = null;
    };
  }, [initialDataUrl, onChange, width, height]);

  useImperativeHandle(ref, () => ({
    getDataUrl: (scale = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      // create offscreen canvas with requested scale for high-res export
      const ratio = window.devicePixelRatio || 1;
      const exportRatio = ratio * scale;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = Math.round(width * exportRatio);
      exportCanvas.height = Math.round(height * exportRatio);
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return null;
      // draw the current visible canvas onto export canvas scaled
      // draw image from original canvas (which is already scaled by devicePixelRatio)
      ctx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
      return exportCanvas.toDataURL('image/png');
    },
    clear: () => {
      const sp = signaturePadRef.current;
      if (!sp) return;
      sp.clear();
      setHasContent(false);
      onChange?.(null);
    },
  }), [onChange, width, height]);

  const clear = () => {
    const sp = signaturePadRef.current;
    if (!sp) return;
    sp.clear();
    setHasContent(false);
    // don't call onChange here as clearing only affects the pending drawing; parent will update when Accept/clear is used
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasContent(true);
        onChange?.(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
    e.currentTarget.value = '';
  };

  return (
    <div>
      <div className="border rounded overflow-hidden">
        <canvas ref={canvasRef} className="bg-white touch-none" aria-label="signature-canvas" />
      </div>


      <div className="flex items-center gap-2 mt-2 no-print">
        <label title="Upload an image file (PNG, JPG)" className="inline-flex items-center px-3 py-1.5 rounded bg-gray-100 text-sm cursor-pointer">
          <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" aria-label="Upload signature file" />
          Upload signature
        </label>
        <button title="Discard the pending signature" type="button" onClick={clear} className="inline-flex items-center px-3 py-1.5 rounded bg-gray-100 text-sm">Discard</button>
        <button title="Accept the pending signature" type="button" onClick={() => {
          const sp = signaturePadRef.current;
          if (!sp || sp.isEmpty()) return;
          const data = sp.toDataURL('image/png');
          setHasContent(true);
          onChange?.(data);
        }} className="inline-flex items-center px-3 py-1.5 rounded bg-emerald-100 text-sm">Accept</button>
        <div className="text-sm text-muted-foreground">Draw or upload a signature, then press Accept to save it.</div>
      </div>

      {!accepted && (
        <div className="mt-2 text-xs text-muted-foreground">Tip: Draw using mouse or finger, then press Accept to save it.</div>
      )}
    </div>
  );
});

export default SignaturePad;
