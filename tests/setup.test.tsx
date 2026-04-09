import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../src/App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', {
        level: 1,
        hidden: true,
        name: /correct your affiliation name/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /affiliation builder/i })).toBeInTheDocument()
  })

  it('opens keyboard help with Shift+?', async () => {
    render(<App />)
    fireEvent.keyDown(window, { key: '?', shiftKey: true, bubbles: true })
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByText(/Keyboard & interaction/i)).toBeInTheDocument()
  })

  it('vitest is configured correctly', () => {
    expect(1 + 1).toBe(2)
  })
})
