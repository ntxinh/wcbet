import { describe, expect, it } from 'vitest'
import { isLocked, scorePrediction } from '@/lib/scoring'

describe('scorePrediction', () => {
  it('awards 3 points for exact score', () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 2, away: 1 })).toBe(3)
    expect(scorePrediction({ home: 0, away: 0 }, { home: 0, away: 0 })).toBe(3)
  })

  it('awards 1 point for correct outcome, wrong score', () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 1, away: 0 })).toBe(1) // home win
    expect(scorePrediction({ home: 1, away: 1 }, { home: 0, away: 0 })).toBe(1) // draw
    expect(scorePrediction({ home: 0, away: 2 }, { home: 1, away: 3 })).toBe(1) // away win
  })

  it('awards 0 points for wrong outcome', () => {
    expect(scorePrediction({ home: 2, away: 0 }, { home: 0, away: 2 })).toBe(0)
    expect(scorePrediction({ home: 1, away: 1 }, { home: 2, away: 1 })).toBe(0)
    expect(scorePrediction({ home: 3, away: 1 }, { home: 1, away: 1 })).toBe(0)
  })
})

describe('isLocked', () => {
  const kickoff = new Date('2026-06-11T18:00:00Z')
  it('is unlocked before kickoff', () => {
    expect(isLocked(kickoff, new Date('2026-06-11T17:59:59Z'))).toBe(false)
  })
  it('is locked exactly at kickoff', () => {
    expect(isLocked(kickoff, new Date('2026-06-11T18:00:00Z'))).toBe(true)
  })
  it('is locked after kickoff', () => {
    expect(isLocked(kickoff, new Date('2026-06-11T18:00:01Z'))).toBe(true)
  })
})
