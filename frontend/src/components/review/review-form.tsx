import { useState } from "react"
import StarRating from "./star-rating"

export default function ReviewForm() {
  const [rating, setRating] = useState<number>(0)

  return <StarRating rating={rating} onRatingChange={setRating} />
}
