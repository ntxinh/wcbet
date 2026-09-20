import { create } from 'zustand'

export type StatusFilter = 'all' | 'upcoming' | 'in_progress' | 'finished'

interface FilterState {
  status: StatusFilter
  setStatus: (s: StatusFilter) => void
}

export const useFilterStore = create<FilterState>()((set) => ({
  status: 'all',
  setStatus: (status) => set({ status }),
}))
