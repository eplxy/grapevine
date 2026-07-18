import { useFeedQuery } from "@/hooks/queries/post-queries"
import Post from "./post"

export default function PostList() {
  // const [page, setPage] = useState<number>(1)
  const page = 1

  const feedQuery = useFeedQuery(page * 10, (page - 1) * 10)

  const isEmpty = feedQuery.isSuccess && feedQuery.data.length === 0

  if (isEmpty) return (
    <NoPostsFound/>
  )


  return (
    <div className="flex flex-col gap-6 px-4">
      {feedQuery.isSuccess &&
        feedQuery.data.map((post) => (
          <Post key={post.post_id} feedItem={post} />
        ))}
    </div>
  )
}


function NoPostsFound() {
  return (

    <div className="flex flex-col items-center h-full justify-center mb-40">

      <h1 className="text-secondary-foreground text-lg">it's a little quiet here</h1>
      <span className="text-muted-foreground text-sm">seems like there aren't any posts... yet</span>
    </div>
  )

}
