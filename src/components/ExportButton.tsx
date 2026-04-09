import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  label: string;
  icon?: React.ReactNode;
  onCopy: () => Promise<boolean>;
  tooltip?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  disabledReason?: string;
  /** When disabled, links the control to visible hint text (e.g. role="status") for screen readers. */
  describedById?: string;
}

export function ExportButton({
  label,
  icon,
  onCopy,
  tooltip,
  variant = 'outline',
  size = 'sm',
  disabled = false,
  disabledReason = 'Add an author and at least one affiliation first.',
  describedById,
}: ExportButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled) return;
    setIsLoading(true);
    try {
      const success = await onCopy();
      if (success) {
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error('Copy failed — try again or check permissions.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={disabled ? disabledReason : undefined}
      aria-disabled={disabled}
      aria-describedby={disabled && describedById ? describedById : undefined}
      className={
        copied
          ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-50 hover:text-emerald-900'
          : 'rounded-full'
      }
    >
      {copied ? (
        <>
          <Check className="mr-1 h-4 w-4" aria-hidden />
          Copied!
        </>
      ) : (
        <>
          {icon || <Copy className="mr-1 h-4 w-4" aria-hidden />}
          {label}
        </>
      )}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{disabled ? disabledReason : tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
