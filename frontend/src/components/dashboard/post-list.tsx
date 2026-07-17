import { useFeedQuery } from "@/hooks/queries/post-queries"
import { useState } from "react"
import Post from "./post"

export default function PostList() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useState<number>(1)

  const feedQuery = useFeedQuery(page * 10, (page - 1) * 10)

  return (
    <div className="flex flex-col gap-6 px-4">
      {feedQuery.isSuccess && feedQuery.data.map((post) => <Post feedItem={post} />)}
    </div>
  )
}
