import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,560px)] overflow-y-auto rounded-[1.5rem] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Keyboard &amp; interaction</DialogTitle>
          <DialogDescription>
            Tips for working without a mouse. Press Escape to close this dialog.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-3 pl-5 text-sm text-foreground">
          <li>
            <strong>Tab / Shift+Tab</strong> — On the main anchors (sidebar <strong>Add</strong> or{' '}
            <strong>Expand</strong>, <strong>Add Author</strong>, builder <strong>HKU Units</strong> tab, HKU
            keyword field, <strong>Formatting options</strong>), Tab cycles in that order and loops back to the
            sidebar. Other controls keep normal tab order. In the External search field, <strong>Tab</strong>{' '}
            moves focus to the builder tabs. Within a panel, use arrow keys to move
            between controls (left/right arrows still move the cursor in text fields). Reorder rows with{' '}
            <strong>Move up</strong> / <strong>Move down</strong> or by dragging.
          </li>
          <li>
            <strong>HKU search</strong> — In the keyword field, use <strong>Arrow keys</strong> and{' '}
            <strong>Enter</strong> to choose a result or the <strong>(DIY)</strong> row.{' '}
            <strong>Home</strong> / <strong>End</strong> jump within the list when the command menu is active.
          </li>
          <li>
            <strong>Link affiliation</strong> — On each author, use the dropdown to attach a pool institution
            without dragging.
          </li>
          <li>
            <strong>Panel split</strong> — Focus the bar between Affiliations and Authors, then{' '}
            <strong>Arrow Up</strong> / <strong>Arrow Down</strong> to resize sections.
          </li>
          <li>
            <strong>Shift+?</strong> — Open this help (ignored while typing in a field).
          </li>
          <li>
            <strong>Touch (narrow screens)</strong> — Swipe right from the left screen edge to open the
            workspace drawer; with the drawer open, swipe left on the dimmed area beside the drawer to close
            it.
          </li>
          <li>
            <strong>Reduce motion</strong> — If your OS prefers reduced motion, decorative background animation
            is minimized.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
