import { useQuery } from "@tanstack/react-query"
import { locationKeys } from "./query-keys"
import { api } from "@/lib/api"
import type { LocationAutocompleteSuggestion } from "@/models/models"

export const useLocationAutocomplete = (query: string) => {
  return useQuery({
    queryKey: locationKeys.autocomplete(query),
    queryFn: () =>
      api
        .url("/location/autocomplete")
        .post({ query })
        .json<LocationAutocompleteSuggestion[]>((res) => res.suggestions),
  })
}
