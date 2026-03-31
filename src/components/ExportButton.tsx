import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Copy } from 'lucide-react';

interface ExportButtonProps {
  label: string;
  icon?: React.ReactNode;
  onCopy: () => Promise<boolean>;
  tooltip?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({
  label,
  icon,
  onCopy,
  tooltip,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const success = await onCopy();
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
      disabled={isLoading}
      className={copied ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-50' : ''}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Copied!
        </>
      ) : (
        <>
          {icon || <Copy className="h-4 w-4 mr-1" />}
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
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
