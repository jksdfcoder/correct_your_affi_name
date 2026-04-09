import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildAffiliationReportMailto } from '@/lib/affiliation-report-mailto';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefill from HKU keyword field when opened from the DIY row */
  defaultAffiliationName: string;
  searchKeywords: string;
};

export function ReportAffiliationDialog({
  open,
  onOpenChange,
  defaultAffiliationName,
  searchKeywords,
}: Props) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(defaultAffiliationName.trim());
    setDepartment('');
    setFaculty('');
  }, [open, defaultAffiliationName]);

  const handleSend = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Please enter an affiliation name.');
      return;
    }
    const href = buildAffiliationReportMailto({
      affiliationName: trimmed,
      department,
      faculty,
      searchKeywords,
    });
    try {
      window.location.href = href;
      toast.success('Opening your email app — send the message to complete the report.');
      onOpenChange(false);
    } catch {
      toast.error('Could not open the email app. Copy the details and email manually.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,520px)] max-w-[min(100vw-1.5rem,400px)] gap-4 overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-0 text-left">
          <DialogTitle className="font-serif text-lg">Report to us</DialogTitle>
          <DialogDescription className="sr-only">
            Submit a missing or incorrect HKU affiliation for review.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="report-affiliation-name" className="text-xs font-semibold">
              Affiliation name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="report-affiliation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Department of Example"
              className="rounded-xl"
              autoComplete="organization"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-department" className="text-xs font-semibold">
              Department <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="report-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Department"
              className="rounded-xl"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-faculty" className="text-xs font-semibold">
              Faculty <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="report-faculty"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="Faculty"
              className="rounded-xl"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full rounded-xl bg-foreground font-bold text-background hover:bg-foreground/90"
            onClick={handleSend}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
