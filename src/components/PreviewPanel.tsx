import { useMemo } from 'react';
import { Eye, FileText, Code, FileType } from 'lucide-react';
import { useAuthorStore } from '@/stores/author-store';
import { renderToHtml, renderToPlainText } from '@/lib/template-renderer';
import { copyRichTextToClipboard, wrapForWord } from '@/lib/export/rich-text';
import { renderToLatex, copyLatexToClipboard } from '@/lib/export/latex';
import { ExportButton } from './ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function PreviewPanel() {
  const authors = useAuthorStore((s) => s.authors);
  const institutions = useAuthorStore((s) => s.institutions);
  const templateConfig = useAuthorStore((s) => s.templateConfig);
  const getNumberedOutput = useAuthorStore((s) => s.getNumberedOutput);

  const numberedOutput = useMemo(() => getNumberedOutput(), [authors, institutions, templateConfig, getNumberedOutput]);
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

  const isEmpty = authors.length === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Preview</h2>
        </div>
        <Badge variant="secondary" className="capitalize">
          {templateConfig.preset}
        </Badge>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardContent className="p-8">
            {isEmpty ? (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted/50" />
                <p className="text-base font-medium text-foreground mb-1">
                  No preview available
                </p>
                <p className="text-sm max-w-[300px] mx-auto">
                  Add authors and affiliations to see the formatted output here.
                </p>
              </div>
            ) : (
              <div
                className="preview-content prose prose-slate max-w-none"
                style={{
                  fontFamily: '"Times New Roman", Times, Georgia, serif',
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Toolbar */}
      <Separator />
      <div className="p-4 bg-card border-t flex items-center justify-center gap-3 flex-wrap">
        <ExportButton
          label="Copy to Word"
          icon={<FileText className="h-4 w-4 mr-1" />}
          onCopy={handleCopyWord}
          tooltip="Copy rich text with superscripts for Word"
        />
        <ExportButton
          label="Copy LaTeX"
          icon={<Code className="h-4 w-4 mr-1" />}
          onCopy={handleCopyLatex}
          tooltip="Copy authblk-compatible LaTeX code"
        />
        <ExportButton
          label="Copy Plain Text"
          icon={<FileType className="h-4 w-4 mr-1" />}
          onCopy={handleCopyPlainText}
          tooltip="Copy plain text with bracketed superscripts"
        />
      </div>

      {/* Preview Styling */}
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
