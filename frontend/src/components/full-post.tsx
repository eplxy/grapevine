import type { FeedItemModel } from "@/models/models"
import { VIEWER_CLASSES } from "@/styles/styles"
import { generateHTML } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import clsx from "clsx"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useMemo } from "react"
import { MediaCarousel } from "./dashboard/post"
import UserAvatar from "./user-avatar"

export interface FullPostProps {
  post: FeedItemModel
}
dayjs.extend(relativeTime)

export default function FullPost(props: FullPostProps) {
  const html = useMemo(() => {
    try {
      if (!props.post.content) return ""

      return generateHTML(props.post.content, [StarterKit])
    } catch (error) {
      console.error("Failed to parse note content", error)
      return `<p class='text-destructive'>Error loading content</p>`
    }
  }, [props.post.content])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-row items-center gap-4">
        <UserAvatar username={props.post.author_name} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {props.post.author_name}
          </span>
          <span
            className="text-xs text-muted-foreground"
            title={dayjs(props.post.created_at).format("MMMM D, YYYY, hh:mm")}
          >
            {dayjs(props.post.created_at).fromNow()}
          </span>
        </div>
      </div>
      <div
        className={clsx(VIEWER_CLASSES)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {props.post.media && props.post.media.length > 0 && (
        <MediaCarousel items={props.post.media} />
      )}
    </div>
  )
}
