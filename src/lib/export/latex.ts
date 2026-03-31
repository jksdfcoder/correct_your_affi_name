/**
 * LaTeX Exporter Module
 *
 * Generates LaTeX authblk-compatible output for author-affiliation blocks.
 * Outputs plain text LaTeX that can be copied and pasted into documents.
 */

import type { NumberedOutput, TemplateConfig } from "@/types";

/**
 * LaTeX special character escape map
 */
const LATEX_ESCAPE_MAP: Record<string, string> = {
  "&": "\\&",
  "%": "\\%",
  $: "\\$",
  "#": "\\#",
  _: "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

/**
 * Unicode symbol to LaTeX command mapping
 */
const LATEX_SYMBOL_MAP: Record<string, string> = {
  "†": "$\\dagger$",
  "‡": "$\\ddagger$",
  "*": "*",
  "§": "\\S",
};

/**
 * Escapes special LaTeX characters in text
 *
 * @param text - Plain text to escape
 * @returns LaTeX-safe string
 */
export function escapeLatex(text: string): string {
  return text.replace(/[&%$#_{}~^]/g, (char) => LATEX_ESCAPE_MAP[char] || char);
}

/**
 * Converts a Unicode symbol to its LaTeX equivalent
 *
 * @param symbol - Unicode symbol (e.g., '†', '‡', '*', '§')
 * @returns LaTeX command string
 */
export function getLatexSymbol(symbol: string): string {
  return LATEX_SYMBOL_MAP[symbol] ?? symbol;
}

/**
 * Renders numbered output to LaTeX authblk format
 *
 * @param output - The numbered output from the numbering engine
 * @param config - Template configuration
 * @returns LaTeX string with authblk commands
 */
export function renderToLatex(
  output: NumberedOutput,
  _config: TemplateConfig
): string {
  if (output.authors.length === 0) {
    return "";
  }

  const lines: string[] = [];

  // Package requirement comment
  lines.push("% Requires: \\usepackage{authblk}");
  lines.push("\\usepackage{authblk}");
  lines.push("");

  // Render authors
  for (const { author, superscripts, symbols } of output.authors) {
    const affiliationNums = superscripts.join(",");

    // Build author name with symbols
    let authorName = escapeLatex(author.name);

    // Add symbols as superscripts
    for (const symbol of symbols) {
      const latexSymbol = getLatexSymbol(symbol);
      if (latexSymbol === "*") {
        authorName += "\\textsuperscript{*}";
      } else {
        authorName += `\\textsuperscript{${latexSymbol}}`;
      }
    }

    lines.push(`\\author[${affiliationNums}]{${authorName}}`);
  }

  lines.push("");

  // Render affiliations
  for (const { number, displayText } of output.affiliations) {
    const escapedText = escapeLatex(displayText);
    lines.push(`\\affil[${number}]{${escapedText}}`);
  }

  // Render footnotes as comments
  if (output.footnotes.length > 0) {
    lines.push("");
    lines.push("% Footnotes:");
    for (const { symbol, text } of output.footnotes) {
      const latexSymbol = getLatexSymbol(symbol);
      lines.push(`% \\textsuperscript{${latexSymbol}} ${escapeLatex(text)}`);
    }
  }

  return lines.join("\n");
}

/**
 * Copies LaTeX content to clipboard as plain text
 *
 * @param latex - LaTeX string to copy
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function copyLatexToClipboard(latex: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(latex);
    return true;
  } catch (error) {
    console.warn("Failed to copy LaTeX to clipboard:", error);
    return false;
  }
}
