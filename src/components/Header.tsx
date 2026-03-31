import { Github, GraduationCap } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Correct Your Affiliation Name
          </h1>
          <p className="text-xs text-muted-foreground">
            Generate correctly formatted author-affiliation blocks for paper submissions
          </p>
        </div>
      </div>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
        aria-label="View on GitHub"
      >
        <Github className="w-5 h-5" />
      </a>
    </header>
  );
}
