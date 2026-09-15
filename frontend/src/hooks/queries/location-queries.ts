import { useQuery } from "@tanstack/react-query"
import { locationKeys } from "./query-keys"
import { api } from "@/lib/api"
import type {
  LocationAutocompleteSuggestion,
  LocationDetails,
} from "@/models/models"

export const useLocationAutocomplete = (query: string) => {
  return useQuery({
    queryKey: locationKeys.autocomplete(query),
    queryFn: () =>
      api
        .url("/location/autocomplete")
        .post({ query })
        .json<LocationAutocompleteSuggestion[]>((res) => res.suggestions),
    enabled: query.length > 0,
  })
}

export const useLocationDetails = (placeID: string | undefined) => {
  return useQuery({
    queryKey: locationKeys.details(placeID || ""),
    queryFn: () =>
      api
        .url("/location/details")
        .post({ place_id: placeID })
        .json<LocationDetails>(),
    enabled: !!placeID,
    staleTime: Infinity,
  })
}
