import CommentSection from "@/components/comment-section"
import FullPost from "@/components/full-post"
import { Button } from "@/components/ui/button"
import { useGetPost } from "@/hooks/queries/post-queries"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

export const Route = createFileRoute("/_app/post/$postId")({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { postId: postIdString } = Route.useParams()
  const postId = parseInt(postIdString, 10)
  const postQuery = useGetPost(postId)

  return (
    <>
      <main className="flex min-h-screen w-full flex-col gap-2 bg-card px-2 md:max-w-150">
        <div className="sticky top-0 z-10 flex flex-row items-center gap-4 border-b border-border bg-card p-2">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => router.history.back()}
            className="cursor-pointer"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-lg font-semibold">Post</h1>
        </div>
        {postQuery.isSuccess && !!postQuery.data && (
          <>
            <FullPost post={postQuery.data} />
            <CommentSection postId={postQuery.data.post_id} />
          </>
        )}
      </main>
      <aside className="sticky top-0 ml-8 hidden h-screen w-[320px] flex-col px-6 py-6 xl:flex"></aside>
    </>
  )
}
