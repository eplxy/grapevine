import { useState } from "react"
import { Skeleton } from "../ui/skeleton"

export default function PostCarouselImage({
  url,
  onImageLoad,
}: {
  url: string
  onImageLoad: (ratio: number) => void
}) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {isLoading && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-md" />
      )}
      <img
        className={`h-full w-full rounded-md object-contain transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        src={url}
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget
          const imageRatio = naturalWidth / naturalHeight

          onImageLoad(imageRatio)
          setIsLoading(false)
        }}
        alt="Post media"
      />
    </>
  )
}
