import '@testing-library/jest-dom'
import '@testing-library/jest-dom/vitest'

/** jsdom: used by WorkspaceSidebar (mobile breakpoint) */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

/** jsdom: cmdk uses ResizeObserver */
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
