import type { FeedItemModel, MediaItem } from "@/models/models"
import { EDITOR_CLASSES } from "@/styles/styles"
import { generateHTML } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "../ui/card"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNavigation,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel"
import UserAvatar from "../user-avatar"

type PostProps = {
  feedItem: FeedItemModel
}

dayjs.extend(relativeTime)

export default function Post(props: PostProps) {
  const { feedItem } = props
  // const likeCount = 0
  // const replyCount = 0

  const html = useMemo(() => {
    try {
      if (!props.feedItem.content) return ""

      return generateHTML(props.feedItem.content, [StarterKit])
    } catch (error) {
      console.error("Failed to parse note content", error)
      return `<p class='text-destructive'>Error loading content</p>`
    }
  }, [props.feedItem.content])

  return (
    <Card className="border-b border-none pb-4 shadow-none">
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar username={props.feedItem.author_name} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{feedItem.author_name}</span>
          <span
            className="text-xs text-muted-foreground"
            title={dayjs(feedItem.created_at).format("MMMM D, YYYY, hh:mm")}
          >
            {dayjs(feedItem.created_at).fromNow()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!!feedItem.content && (
          <div
            className={EDITOR_CLASSES}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {feedItem.media && feedItem.media.length > 0 && (
          <MediaCarousel items={feedItem.media} />
        )}
      </CardContent>
      {/*<CardFooter className="flex gap-6 text-muted-foreground">
        <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
          <Heart className="h-5 w-5" /> {likeCount}
        </button>
        <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
          <MessageCircle className="h-5 w-5" /> {replyCount}
        </button>
        <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
          <Share className="h-5 w-5" />
        </button>
      </CardFooter>*/}
    </Card>
  )
}

function MediaCarousel({ items }: { items: MediaItem[] }) {

  return (
    <Carousel className="relative w-full">
      <CarouselContent>
        {items.map((mediaItem) => (
          <CarouselItem key={mediaItem.display_order + mediaItem.url}>
            <div className="relative my-2 flex aspect-video w-full items-center justify-center rounded-md bg-muted">
              <img src={mediaItem.url}></img>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselNavigation/>
    </Carousel>
  )
}
