import {
  useCommentsInfiniteQuery,
  useCreateCommentMutation,
} from "@/hooks/queries/post-queries"
import { useAuthSessionQuery } from "@/hooks/queries/auth-queries"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Loader2, Send } from "lucide-react"
import { useState } from "react"

dayjs.extend(relativeTime)

export default function CommentSection({ postId }: { postId: number }) {
  const [content, setContent] = useState("")
  const commentsQuery = useCommentsInfiniteQuery(postId)
  const createCommentMutation = useCreateCommentMutation(postId)
  const sessionQuery = useAuthSessionQuery()
  const comments =
    commentsQuery.data?.pages.flatMap((page) => page.data) ?? []
  const isAuthenticated = sessionQuery.data?.authenticated === true
  const canSubmit = content.trim().length > 0 && content.trim().length <= 2000

  const submitComment = () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || trimmedContent.length > 2000) return

    createCommentMutation.mutate(trimmedContent, {
      onSuccess: () => setContent(""),
    })
  }

  return (
    <section className="flex flex-1 flex-col gap-4 pb-6">
      <h2 className="text-lg font-semibold">Comments</h2>

      {isAuthenticated && (
        <div className="flex items-start gap-2">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a comment..."
            maxLength={2000}
            rows={2}
            aria-label="Comment"
            disabled={createCommentMutation.isPending}
          />
          <Button
            type="button"
            size="icon"
            aria-label="Post comment"
            onClick={submitComment}
            disabled={!canSubmit || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </div>
      )}

      {commentsQuery.isPending && (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      )}
      {commentsQuery.isError && (
        <p className="text-sm text-destructive">
          Unable to load comments. Please try again.
        </p>
      )}
      {!commentsQuery.isPending &&
        !commentsQuery.isError &&
        comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}

      <div className="flex flex-col divide-y divide-border">
        {comments.map((comment) => (
          <article key={comment.id} className="flex gap-3 py-3">
            <Avatar size="sm">
              <AvatarFallback>
                {comment.author_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-medium">{comment.author_name}</p>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={comment.created_at}
                >
                  {dayjs(comment.created_at).fromNow()}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">
                {comment.content}
              </p>
            </div>
          </article>
        ))}
      </div>

      {commentsQuery.hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          onClick={() => void commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
        >
          {commentsQuery.isFetchingNextPage
            ? "Loading..."
            : "Load more comments"}
        </Button>
      )}
    </section>
  )
}
