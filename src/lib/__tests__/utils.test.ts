import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })

  it('handles conditional classes', () => {
    const isVisible = false
    expect(cn('bg-red-500', isVisible && 'text-white', 'p-4')).toBe('bg-red-500 p-4')
  })

  it('merges tailwind classes correctly (last one wins)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })
})
