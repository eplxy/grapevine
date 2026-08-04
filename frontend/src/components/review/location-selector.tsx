import type { LocationAutocompleteSuggestion } from "@/models/models"
import { useState } from "react"
import LocationAutocomplete from "./location-autocomplete"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"

export type LocationSelectorProps = {}

export type LocationModel = {} & LocationAutocompleteSuggestion

export default function LocationSelector(props: LocationSelectorProps) {
  const [location, setLocation] = useState<LocationModel>()

  return (
    <>
          <LocationAutocomplete location={location} setLocation={setLocation} />
    </>
  )
}
