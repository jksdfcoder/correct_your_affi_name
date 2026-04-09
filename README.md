# Correct Your Affiliation Name

A privacy-first, pure-frontend web tool that helps scholars generate correctly formatted author-affiliation blocks for academic paper submissions.

## Features

- **HKU Institutional Dictionary** — Built-in autocomplete for HKU faculties, departments, labs, hospitals, and centres
- **ROR API Integration** — Search any institution worldwide via the [Research Organization Registry](https://ror.org/)
- **Multiple Template Presets** — Nature/Science numeric superscript, alphabetic, IEEE, and compact styles
- **Rich Text Export** — Copy to clipboard with working superscripts, pastes correctly into Microsoft Word
- **LaTeX Export** — Compatible with the `authblk` package
- **Author Management** — Add, delete, drag-to-reorder authors; assign co-first-author (†) and corresponding author (*) markers
- **Hong Kong Suffix Toggle** — Switch between "Hong Kong", "Hong Kong, China", and "Hong Kong SAR, China"
- **LocalStorage Persistence** — Your work survives page refresh
- **100% Client-Side** — Zero backend, zero tracking, zero data sent to any server (except ROR search queries)

## Tech Stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://zustand-demo.pmnd.rs/) — state management
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) — UI components
- [@dnd-kit](https://dndkit.com/) — drag-and-drop
- [Vitest](https://vitest.dev/) — unit testing

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm test          # run unit tests
```

Keyboard, screen reader, and manual smoke checks: see [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Deployment

### GitHub Pages

1. In the repo on GitHub: **Settings → Pages → Build and deployment**.
2. Under **Source**, choose **GitHub Actions** (not “Deploy from a branch”).
3. Push to `main` (or run **Actions → Deploy to GitHub Pages → Run workflow**). The workflow `.github/workflows/deploy-pages.yml` builds with `npm run build` and publishes `dist/`.

Your site URL will be `https://<user>.github.io/correct_your_affi_name/`. This app uses `base: './'` in Vite so assets load correctly under that project path.

**Note:** If the repository is **private**, the Pages site can still be **public** (GitHub shows a warning). Use a public repo if you want the code and site visibility aligned.

### Docker (Internal)

```bash
docker build -t correct-your-affi-name .
docker run -p 8080:80 correct-your-affi-name
# → http://localhost:8080
```

## Project Structure

```
src/
├── data/               # HKU institutional dictionary (JSON)
├── types/              # TypeScript type definitions
├── lib/
│   ├── hku-dictionary.ts       # Dictionary loader & search
│   ├── numbering-engine.ts     # Superscript assignment algorithm
│   ├── ror-client.ts           # ROR API client
│   ├── template-renderer.ts    # HTML & plain-text rendering
│   └── export/
│       ├── rich-text.ts        # Clipboard rich-text export
│       └── latex.ts            # LaTeX (authblk) export
├── hooks/              # useHkuDictionary, useRorSearch
├── stores/             # Zustand store
└── components/         # React UI components
tests/                  # Vitest unit tests
```

## License

MIT
