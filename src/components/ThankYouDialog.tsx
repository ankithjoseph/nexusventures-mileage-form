import React from 'react';
import { CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col items-center text-center gap-4 py-6 px-4">
          <div className="bg-green-100 text-green-700 rounded-full p-3">
            <CheckCircle className="h-8 w-8" />
          </div>

          <DialogHeader className="items-center">
            <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground max-w-[40ch]">{description}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="w-full justify-center gap-3">
            {secondaryLabel && onSecondary ? (
              <Button variant="outline" onClick={() => { onSecondary(); onOpenChange(false); }}>
                {secondaryLabel}
              </Button>
            ) : null}

            <DialogClose asChild>
              <Button size="lg" onClick={() => { onPrimary?.(); onOpenChange(false); }}>{primaryLabel}</Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThankYouDialog;
