import { useMemo, useState, type Ref } from 'react';
import { Eye, FileText, Code, FileType, SlidersHorizontal } from 'lucide-react';
import { useAuthorStore } from '@/stores/author-store';
import { renderToHtml, renderToPlainText } from '@/lib/template-renderer';
import { getExampleNumberedOutput } from '@/lib/example-preview';
import { copyRichTextToClipboard, wrapForWord } from '@/lib/export/rich-text';
import { renderToLatex, copyLatexToClipboard } from '@/lib/export/latex';
import { ExportButton } from './ExportButton';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { SettingsPanel } from './SettingsPanel';

type PreviewPanelProps = {
  formattingButtonRef?: Ref<HTMLButtonElement>;
};

type PreviewBodyProps = {
  poolEmpty: boolean;
  hasLivePreview: boolean;
  htmlContent: string;
  emptyPoolHtml: string;
};

function PreviewBody({ poolEmpty, hasLivePreview, htmlContent, emptyPoolHtml }: PreviewBodyProps) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 bg-gradient-to-b from-muted/20 to-transparent p-4 sm:p-6',
        'max-md:flex-none max-md:overflow-visible max-md:min-h-0',
        'md:overflow-y-auto'
      )}
    >
      <Card className="mx-auto max-w-3xl rounded-[2rem] border-border/50 shadow-soft">
        <CardContent className="p-6 sm:p-8">
          {poolEmpty ? (
            <div className="space-y-6">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start with affiliations
              </p>
              <div
                className="space-y-2 rounded-[1.25rem] border border-dashed border-border/70 bg-muted/20 p-4 motion-reduce:animate-none"
                aria-hidden
              >
                <div className="h-3 w-3/4 max-w-md animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
                <div className="h-3 w-full max-w-lg animate-pulse rounded-full bg-muted/80 motion-reduce:animate-none" />
                <div className="h-3 w-5/6 max-w-md animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
              </div>
              <div
                className="preview-content prose prose-neutral max-w-none rounded-[1.25rem] border border-border/40 bg-white/60 p-4 text-left text-sm"
                style={{
                  fontFamily: '"Times New Roman", Times, Georgia, serif',
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: emptyPoolHtml }}
              />
              <p className="text-center text-sm text-muted-foreground">
                Use <strong className="text-foreground">Affiliation builder</strong> above to add HKU
                units, ROR, or custom lines. Then add authors in the sidebar and drag affiliations onto
                them.
              </p>
            </div>
          ) : hasLivePreview ? (
            <div
              className="preview-content prose prose-neutral max-w-none"
              style={{
                fontFamily: '"Times New Roman", Times, Georgia, serif',
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Affiliations are in the pool but nothing to render yet. Assign them to authors or check
              formatting options.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PreviewPanel({ formattingButtonRef }: PreviewPanelProps) {
  const authors = useAuthorStore((s) => s.authors);
  const institutions = useAuthorStore((s) => s.institutions);
  const institutionOrder = useAuthorStore((s) => s.institutionOrder);
  const templateConfig = useAuthorStore((s) => s.templateConfig);
  const getNumberedOutput = useAuthorStore((s) => s.getNumberedOutput);
  const [formattingOpen, setFormattingOpen] = useState(false);

  const numberedOutput = useMemo(
    () => getNumberedOutput(),
    [authors, institutions, institutionOrder, templateConfig, getNumberedOutput]
  );
  const htmlContent = useMemo(
    () => renderToHtml(numberedOutput, templateConfig),
    [numberedOutput, templateConfig]
  );
  const plainTextContent = useMemo(
    () => renderToPlainText(numberedOutput, templateConfig),
    [numberedOutput, templateConfig]
  );
  const latexContent = useMemo(
    () => renderToLatex(numberedOutput, templateConfig),
    [numberedOutput, templateConfig]
  );

  const emptyPoolHtml = useMemo(() => {
    const example = getExampleNumberedOutput(templateConfig);
    return renderToHtml(example, templateConfig);
  }, [templateConfig]);

  const handleCopyWord = async (): Promise<boolean> => {
    const wrapped = wrapForWord(htmlContent);
    return copyRichTextToClipboard(wrapped);
  };

  const handleCopyLatex = async (): Promise<boolean> => {
    return copyLatexToClipboard(latexContent);
  };

  const handleCopyPlainText = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(plainTextContent);
      return true;
    } catch {
      return false;
    }
  };

  const poolEmpty = institutionOrder.length === 0;
  const hasLivePreview = numberedOutput.affiliations.length > 0;
  const exportDisabled = numberedOutput.affiliations.length === 0;
  const exportReason = 'Add at least one affiliation in the builder before exporting.';

  return (
    <div className="flex h-full min-h-0 max-md:h-auto max-md:min-h-0 flex-col bg-transparent">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-md sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Eye className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <h2 className="font-serif text-base font-bold tracking-tight text-foreground sm:text-lg">
            Preview
          </h2>
        </div>
        <Button
          ref={formattingButtonRef}
          type="button"
          variant="outline"
          className="h-11 rounded-full px-4 text-sm font-semibold shadow-sm"
          onClick={() => setFormattingOpen(true)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Formatting options
        </Button>
      </div>

      <PreviewBody
        poolEmpty={poolEmpty}
        hasLivePreview={hasLivePreview}
        htmlContent={htmlContent}
        emptyPoolHtml={emptyPoolHtml}
      />

      <Separator className="bg-border/80" />
      <div className="border-t border-border/80 bg-card/90 px-4 py-3 backdrop-blur-md sm:px-5">
        {exportDisabled ? (
          <p
            id="panel-export-status"
            role="status"
            className="mb-3 text-center text-sm text-muted-foreground"
          >
            {exportReason}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ExportButton
            label="Copy to Word"
            icon={<FileText className="mr-1 h-4 w-4" />}
            onCopy={handleCopyWord}
            tooltip="Copy rich text with superscripts for Word"
            disabled={exportDisabled}
            disabledReason={exportReason}
            describedById="panel-export-status"
          />
          <ExportButton
            label="Copy LaTeX"
            icon={<Code className="mr-1 h-4 w-4" />}
            onCopy={handleCopyLatex}
            tooltip="Copy authblk-compatible LaTeX code"
            disabled={exportDisabled}
            disabledReason={exportReason}
            describedById="panel-export-status"
          />
          <ExportButton
            label="Copy Plain Text"
            icon={<FileType className="mr-1 h-4 w-4" />}
            onCopy={handleCopyPlainText}
            tooltip="Copy plain text with bracketed superscripts"
            disabled={exportDisabled}
            disabledReason={exportReason}
            describedById="panel-export-status"
          />
        </div>
      </div>

      <Dialog open={formattingOpen} onOpenChange={setFormattingOpen}>
        <DialogContent className="grid h-[min(92dvh,920px)] w-[min(96vw,1240px)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[1.75rem] p-0">
          <div className="border-b border-border/80 bg-card/95 px-5 py-4 backdrop-blur-md sm:px-6">
            <DialogTitle className="font-serif text-lg">Formatting options</DialogTitle>
            <DialogDescription className="sr-only">
              Adjust formatting options on the left and watch the preview update live on the right.
            </DialogDescription>
          </div>

          <div className="grid min-h-0 lg:grid-cols-[380px_minmax(0,1fr)]">
            <div className="min-h-0 border-b border-border/80 bg-background lg:border-b-0 lg:border-r">
              <SettingsPanel hideOuterChrome />
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden bg-muted/10">
              <div className="border-b border-border/80 bg-card/90 px-4 py-3 text-sm font-semibold text-foreground sm:px-5">
                Live preview
              </div>
              <PreviewBody
                poolEmpty={poolEmpty}
                hasLivePreview={hasLivePreview}
                htmlContent={htmlContent}
                emptyPoolHtml={emptyPoolHtml}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .preview-content p {
          margin-bottom: 0.75em;
        }
        .preview-content sup {
          font-size: 0.75em;
          vertical-align: super;
          line-height: 0;
        }
        .preview-content p:first-child {
          font-size: 1.1em;
          margin-bottom: 1em;
        }
      `}</style>
    </div>
  );
}
