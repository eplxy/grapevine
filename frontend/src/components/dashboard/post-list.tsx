import { useFeedQuery } from "@/hooks/queries/post-queries"
import Post from "./post"

export default function PostList() {
  // const [page, setPage] = useState<number>(1)
  const page = 1

  const feedQuery = useFeedQuery(page * 10, (page - 1) * 10)

  return (
    <div className="flex flex-col gap-6 px-4">
      {feedQuery.isSuccess &&
        feedQuery.data.map((post) => (
          <Post key={post.post_id} feedItem={post} />
        ))}
    </div>
  )
}
