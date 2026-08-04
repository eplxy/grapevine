import type { LocationAutocompleteSuggestion } from "@/models/models"
import { useState } from "react"
import LocationAutocomplete from "./location-autocomplete"

export type LocationSelectorProps = {}

export type LocationModel = {} & LocationAutocompleteSuggestion

export default function LocationSelector() {
  const [location, setLocation] = useState<LocationModel>()

  return (
    <>
          <LocationAutocomplete location={location} setLocation={setLocation} />
    </>
  )
}
