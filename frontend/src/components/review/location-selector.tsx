import LocationAutocomplete from "./location-autocomplete"
import { useReviewStore } from "@/stores/review-store"

export default function LocationSelector() {
  const location = useReviewStore((state) => state.selectedLocation)
  const setLocation = useReviewStore((state) => state.setSelectedLocation)

  return (
    <>
      <LocationAutocomplete location={location} setLocation={setLocation} />
    </>
  )
}
