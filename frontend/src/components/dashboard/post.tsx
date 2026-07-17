import { Heart, MessageCircle, Share } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import UserAvatar from "../user-avatar"
import type { FeedItemModel } from "@/models/models"
import dayjs from "dayjs"

type PostProps = {
  feedItem: FeedItemModel
}

export default function Post(props: PostProps) {
  const { feedItem } = props
  const likeCount = 0
  const replyCount = 0
  return (
    <Card className="rounded-none border-b border-none pb-4 shadow-none">
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{feedItem.author_name}</span>
          <span className="text-xs text-muted-foreground">
            {dayjs(feedItem.created_at).format("MMMM D, YYYY")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {!!feedItem.content && (
          <p className="mb-4 text-sm">{feedItem.content}</p>
        )}
        {feedItem.media && feedItem.media.length > 0 && (
          <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted">
            Image Placeholder
            <img src={feedItem.media[0].url}></img>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-6 text-muted-foreground">
        <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
          <Heart className="h-5 w-5" /> {likeCount}
        </button>
        <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
          <MessageCircle className="h-5 w-5" /> {replyCount}
        </button>
        <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
          <Share className="h-5 w-5" />
        </button>
      </CardFooter>
    </Card>
  )
}
