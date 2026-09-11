import { PostType, type FeedItemModel, type MediaItem } from "@/models/models"
import { VIEWER_CLASSES } from "@/styles/styles"
import { generateHTML } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useMemo, useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "../ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNavigation,
} from "../ui/carousel"
import UserAvatar from "../user-avatar"
import PostCarouselImage from "./post-carousel-image"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import StarRating from "../review/star-rating"
import { Edit, MoreHorizontal, Trash } from "lucide-react"
import { Button } from "../ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import CancelConfirmationAlertDialog from "../dialog/cancel-confirmation"
import { useDeletePostMutation } from "@/hooks/queries/post-queries"
import { useAuthSessionQuery } from "@/hooks/queries/auth-queries"

type PostProps = {
  feedItem: FeedItemModel
}

dayjs.extend(relativeTime)

export default function Post(props: PostProps) {
  const { feedItem } = props
  // const likeCount = 0
  // const replyCount = 0

  const [isExpanded, setIsExpanded] = useState(false)
  const [hasMoreContent, setHasMoreContent] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    try {
      if (!props.feedItem.content) return ""

      return generateHTML(props.feedItem.content, [StarterKit])
    } catch (error) {
      console.error("Failed to parse note content", error)
      return `<p class='text-destructive'>Error loading content</p>`
    }
  }, [props.feedItem.content])

  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    // Temporarily measure the collapsed content.
    const wasExpanded = isExpanded
    if (wasExpanded) element.classList.add("line-clamp-5")

    setHasMoreContent(element.scrollHeight > element.clientHeight + 1)

    if (wasExpanded) element.classList.remove("line-clamp-5")
  }, [html, isExpanded])

  return (
    <Card className="border-b border-none pb-4 shadow-none">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-row items-center gap-4">
          <UserAvatar username={props.feedItem.author_name} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {feedItem.author_name}
            </span>
            <span
              className="text-xs text-muted-foreground"
              title={dayjs(feedItem.created_at).format("MMMM D, YYYY, hh:mm")}
            >
              {dayjs(feedItem.created_at).fromNow()}
            </span>
          </div>
        </div>
        <div>
          <MoreOptionsButton post={feedItem}/>
        </div>
      </CardHeader>
      <CardContent>
        {feedItem.post_type === PostType.Review && (
          <div className="flex flex-col items-start pb-2">
            <Tooltip>
              <TooltipTrigger>
                <span className="text-left text-lg font-semibold">
                  {feedItem.location_name}
                </span>
              </TooltipTrigger>
              <TooltipContent>{feedItem.location_address}</TooltipContent>
            </Tooltip>
            {feedItem.rating && (
              <StarRating rating={feedItem.rating} displayOnly size="xs" />
            )}
          </div>
        )}
        {!!feedItem.content && (
          <>
            <div
              ref={contentRef}
              className={`${VIEWER_CLASSES} ${
                !isExpanded ? "line-clamp-4 overflow-hidden" : ""
              }`}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {hasMoreContent && (
              <button
                type="button"
                className="mt-2 cursor-pointer text-sm text-muted-foreground hover:text-lime-200 hover:underline"
                onClick={() => setIsExpanded((expanded) => !expanded)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
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
  const [ratios, setRatios] = useState<number[]>([])
  const minRatio = ratios.length > 0 ? Math.min(...ratios) : 1
  const dynamicRatio = minRatio < 1 ? 1 : minRatio

  return (
    <Carousel className="relative w-full">
      <CarouselContent>
        {items.map((mediaItem) => (
          <CarouselItem key={mediaItem.display_order + mediaItem.url}>
            <div
              className="relative my-2 flex w-full items-center justify-center overflow-hidden rounded-md bg-muted transition-all duration-300"
              style={{ aspectRatio: dynamicRatio }}
            >
              <PostCarouselImage
                url={mediaItem.url}
                onImageLoad={(ratio) => setRatios((prev) => [...prev, ratio])}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselNavigation />
    </Carousel>
  )
}


function MoreOptionsButton({ post }: { post: FeedItemModel }) {
  const deletePostMutation = useDeletePostMutation(post.post_id)

  const { data: session } = useAuthSessionQuery()

  if (!session || session.user_id !== post.author_id) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-w-fit">
        <div className="flex flex-col gap-2">
          <Button disabled variant="outline" className="justify-between gap-4">
            Edit (wip)
            <Edit />
          </Button>
          <CancelConfirmationAlertDialog
            title="Are you sure you want to delete this post?"
            triggerComponent={
              <Button variant="outline" className="justify-between">
                Delete
                <Trash />
              </Button>
            }
            onConfirm={deletePostMutation.mutate}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
