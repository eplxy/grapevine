import type { LocationAutocompleteSuggestion } from "@/models/models"
import { create } from "zustand"

interface ReviewStore {
  selectedLocation: LocationAutocompleteSuggestion | undefined
  setSelectedLocation: (
    location: LocationAutocompleteSuggestion | undefined
  ) => void
}

export const useReviewStore = create<ReviewStore>((set) => ({
  selectedLocation: undefined,
  setSelectedLocation: (selectedLocation) => set({ selectedLocation }),
}))
