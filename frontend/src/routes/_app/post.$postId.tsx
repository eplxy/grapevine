import FullPost from "@/components/full-post"
import { useGetPost } from "@/hooks/queries/post-queries"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/post/$postId")({
  component: RouteComponent,
})

function RouteComponent() {
  const { postId: postIdString } = Route.useParams()
  const postId = parseInt(postIdString, 10)
  const postQuery = useGetPost(postId)

  return (
    <main className="flex min-h-screen w-full flex-col gap-4 pt-6 md:max-w-150">
      {postQuery.isSuccess && !!postQuery.data && (
        <FullPost post={postQuery.data} />
      )}
    </main>
  )
}
