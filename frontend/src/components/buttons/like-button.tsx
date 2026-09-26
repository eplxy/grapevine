import { Heart } from "lucide-react"
import { useState } from "react"
import {
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/hooks/queries/post-queries"
import type { FeedItemModel } from "@/models/models"
import clsx from "clsx"

export type LikeButtonProps = {
  feedItem: FeedItemModel
  disabled?: boolean
}

export default function LikeButton(props: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState<number>(props.feedItem.like_count)
  const [liked, setLiked] = useState<boolean>(props.feedItem.is_liked_by_me)
  const likeMutation = useLikePostMutation(props.feedItem.post_id)
  const unlikeMutation = useUnlikePostMutation(props.feedItem.post_id)

  const handleClick = () => {
    if (liked) {
      unlikeMutation.mutate()
    } else {
      likeMutation.mutate()
    }
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className={
          "flex items-center gap-2 text-sm transition-colors hover:text-foreground"
        }
        disabled={props.disabled}
      >
        <Heart
          className={clsx("h-5 w-5", { "fill-red-400 text-red-400": liked })}
        />
      </button>
      <button>{likeCount}</button>
    </div>
  )
}
