import clsx from "clsx"
import { Star } from "lucide-react"
import { useState } from "react"

export type StarRatingProps = {
  rating: number
  onRatingChange?: (rating: number) => void
  disabled?: boolean
  hideLabel?: boolean
  displayOnly?: boolean
  size?: "sm" | "md" | "lg"
  labelPosition?: "left" | "right"
}

export const starSizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-8 w-8",
}

export default function StarRating({
  rating,
  onRatingChange,
  disabled,
  hideLabel,
  displayOnly,
  size = "md",
  labelPosition = "right",
}: StarRatingProps) {
  const [previewRating, setPreviewRating] = useState<number | null>(null)
  const displayedRating =
    disabled || displayOnly ? rating : (previewRating ?? rating)

  return (
    <div
      className={clsx("flex flex-row", {
        "flex-row-reverse": labelPosition === "left",
      })}
    >
      <div
        className={clsx("flex flex-row items-center", {
          "opacity-50": disabled,
        })}
        role="group"
        aria-label="Rating"
        aria-disabled={disabled}
        onMouseLeave={() => setPreviewRating(null)}
      >
        {[...Array(5)].map((_, index) => {
          const starNumber = index + 1
          const fillPercentage = Math.max(
            0,
            Math.min(100, (displayedRating - index) * 100)
          )

          return (
            <span
              key={starNumber}
              className={clsx("relative", starSizeClasses[size])}
            >
              <Star
                aria-hidden="true"
                className={clsx(
                  "absolute inset-0",
                  starSizeClasses[size],
                  "text-muted-foreground"
                )}
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  className={clsx(
                    "h-",
                    starSizeClasses[size],
                    "w-",
                    starSizeClasses[size],
                    "fill-yellow-400 text-yellow-400"
                  )}
                />
              </span>
              {!displayOnly && (
                <>
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 w-1/2 cursor-pointer rounded-l-sm focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                    disabled={disabled}
                    aria-label={`${starNumber - 0.5} stars`}
                    aria-pressed={rating === starNumber - 0.5}
                    onMouseEnter={() => setPreviewRating(starNumber - 0.5)}
                    onFocus={() => setPreviewRating(starNumber - 0.5)}
                    onClick={() => onRatingChange?.(starNumber - 0.5)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 w-1/2 cursor-pointer rounded-r-sm focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
                    disabled={disabled}
                    aria-label={`${starNumber} stars`}
                    aria-pressed={rating === starNumber}
                    onMouseEnter={() => setPreviewRating(starNumber)}
                    onFocus={() => setPreviewRating(starNumber)}
                    onClick={() => onRatingChange?.(starNumber)}
                  />
                </>
              )}
            </span>
          )
        })}
      </div>
      {!hideLabel && <span className="ml-2">{displayedRating}</span>}
    </div>
  )
}
