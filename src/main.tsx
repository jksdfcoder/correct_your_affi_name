import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

declare global {
  interface Window {
    /** Dev only: paste nothing — run `__dumpWorkspaceLayout()` in the console to inspect sidebar / main widths. */
    __dumpWorkspaceLayout?: () => void
  }
}

if (import.meta.env.DEV) {
  window.__dumpWorkspaceLayout = () => {
    const all = [...document.querySelectorAll('[data-workspace-sidebar]')] as HTMLElement[]
    if (all.length === 0) {
      console.warn('[layout] no [data-workspace-sidebar] in DOM')
      return
    }

    console.log('[layout] all workspace sidebar nodes (desktop + mobile drawer may both exist):')
    all.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const wrap = el.parentElement
      const wcs = wrap ? getComputedStyle(wrap) : null
      console.log(`  #${i}`, {
        visible: r.width > 0 && r.height > 0,
        rectWidth: Math.round(r.width * 100) / 100,
        rectHeight: Math.round(r.height * 100) / 100,
        wrapperDisplay: wcs?.display ?? null,
        wrapperClass: wrap?.className?.slice?.(0, 100) ?? null,
      })
    })

    const aside = all.find((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    })
    if (!aside) {
      console.warn(
        '[layout] 没有「可见」侧栏：若视口 < md，桌面侧栏在 DOM 里但被 hidden md:flex 隐藏（宽高为 0）。请把窗口拉宽到 ≥768px，或先打开 Workspace 抽屉再运行。'
      )
      const main = document.querySelector('[data-app-main-column]')
      if (main instanceof HTMLElement) {
        const mr = main.getBoundingClientRect()
        console.log('[layout] main column [data-app-main-column] width', Math.round(mr.width * 100) / 100)
      }
      return
    }

    const cs = getComputedStyle(aside)
    const r = aside.getBoundingClientRect()
    console.log('[layout] VISIBLE workspace sidebar (measurements below)')
    console.table({
      getBoundingClientRect_width: Math.round(r.width * 100) / 100,
      getBoundingClientRect_height: Math.round(r.height * 100) / 100,
      computed_width: cs.width,
      computed_minWidth: cs.minWidth,
      computed_maxWidth: cs.maxWidth,
      flexShrink: cs.flexShrink,
      overflowX: cs.overflowX,
      overflowY: cs.overflowY,
      clientWidth: aside.clientWidth,
      scrollWidth: aside.scrollWidth,
      scrollbarGutter: cs.scrollbarGutter,
    })
    const parent = aside.parentElement
    if (parent instanceof HTMLElement) {
      const pr = parent.getBoundingClientRect()
      const pcs = getComputedStyle(parent)
      console.log('[layout] sidebar parent', {
        tag: parent.tagName,
        className: parent.className.slice(0, 120),
        display: pcs.display,
        flexDirection: pcs.flexDirection,
        width: Math.round(pr.width * 100) / 100,
      })
    }
    const mainColumn = document.querySelector('[data-app-main-column]')
    if (mainColumn instanceof HTMLElement) {
      const mr = mainColumn.getBoundingClientRect()
      console.log('[layout] main column [data-app-main-column] width', Math.round(mr.width * 100) / 100)
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster richColors position="bottom-center" closeButton />
  </StrictMode>,
)
