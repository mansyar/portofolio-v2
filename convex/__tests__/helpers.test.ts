import { describe, it, expect } from 'vitest'

// Helper function to calculate reading time (we keep it simple for testing)
// In real app it might be imported from convex/blog.ts if exported
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const noOfWords = text.split(/\s/g).length
  return Math.ceil(noOfWords / wordsPerMinute)
}

describe('Convex Logic Helpers', () => {
  describe('calculateReadingTime', () => {
    it('returns 1 for short text', () => {
      expect(calculateReadingTime('Hello world')).toBe(1)
    })

    it('returns correct value for longer text', () => {
      const longText = 'word '.repeat(300)
      expect(calculateReadingTime(longText)).toBe(2) // 300 / 200 = 1.5, ceil = 2
    })
  })
})
