/**
 * Wrap HTML content with Word-compatible meta tags and styling
 * Ensures superscripts render correctly when pasted into Microsoft Word
 */
export function wrapForWord(html: string): string {
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
<meta charset="utf-8">
<style>
  sup { vertical-align: super; font-size: smaller; }
  p { margin: 0 0 0.5em 0; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Generate a Blob from HTML content for clipboard operations
 */
export function generateRichTextBlob(html: string): Blob {
  const wrappedHtml = wrapForWord(html);
  return new Blob([wrappedHtml], { type: 'text/html' });
}

/**
 * Copy rich text (HTML) to clipboard for pasting into Word
 * Uses the modern Clipboard API with ClipboardItem
 * Returns true on success, false on failure
 */
export async function copyRichTextToClipboard(html: string): Promise<boolean> {
  try {
    // Check if Clipboard API is available
    if (!navigator?.clipboard?.write) {
      console.warn('Clipboard API not available');
      return false;
    }

    const blob = generateRichTextBlob(html);
    const clipboardItem = new ClipboardItem({
      'text/html': blob,
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.warn('Failed to copy rich text to clipboard:', error);
    return false;
  }
}

/**
 * Copy plain text to clipboard (fallback for plain text export)
 */
export async function copyPlainTextToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator?.clipboard?.writeText) {
      console.warn('Clipboard API not available');
      return false;
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('Failed to copy text to clipboard:', error);
    return false;
  }
}
