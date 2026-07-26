import logo from "@/assets/grapevine.svg"
import { useFeedQuery } from "@/hooks/queries/post-queries"
import Post from "./post"

export default function PostList() {
  // const [page, setPage] = useState<number>(1)
  const page = 1

  const feedQuery = useFeedQuery(page * 10, (page - 1) * 10)

  const isEmpty = feedQuery.isSuccess && feedQuery.data.length === 0

  if (isEmpty) return <NoPostsFound />

  return (
    <div className="mb-12 flex flex-col gap-6 px-4">
      {feedQuery.isSuccess &&
        feedQuery.data.map((post) => (
          <Post key={post.post_id} feedItem={post} />
        ))}
      <div className="flex w-full justify-center">
        <img src={logo} alt="Grapevine logo" className="h-8 w-auto rotate-33" />
      </div>
    </div>
  )
}

function NoPostsFound() {
  return (
    <div className="mb-40 flex h-full flex-col items-center justify-center">
      <h1 className="text-lg text-secondary-foreground">
        it's a little quiet here
      </h1>
      <span className="text-sm text-muted-foreground">
        seems like there aren't any posts... yet
      </span>
    </div>
  )
}
