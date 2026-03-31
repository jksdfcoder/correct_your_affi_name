import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('Correct Your Affiliation Name')).toBeInTheDocument()
  })

  it('vitest is configured correctly', () => {
    expect(1 + 1).toBe(2)
  })
})
