import { useState } from "react"
import StarRating from "./star-rating"
import { useReviewStore } from "@/stores/review-store"

export default function ReviewForm() {
  const [rating, setRating] = useState<number>(0)

  const selectedLocation = useReviewStore((state) => state.selectedLocation)

  return (
    <StarRating
      rating={rating}
      onRatingChange={setRating}
      disabled={!selectedLocation}
    />
  )
}
