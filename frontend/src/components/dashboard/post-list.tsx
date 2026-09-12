import logo from "@/assets/grapevine.svg"
import { useFeedInfiniteQuery } from "@/hooks/queries/post-queries"
import { useEffect, useMemo, useRef } from "react"
import { Button } from "../ui/button"
import Post from "./post"

export default function PostList() {
  const feedQuery = useFeedInfiniteQuery()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const {
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  } = feedQuery

  const posts = useMemo(
    () => {
      const seen = new Set<number>()
      return feedQuery.data?.pages.flatMap((page) =>
        page.data.filter((post) => {
          if (seen.has(post.post_id)) return false
          seen.add(post.post_id)
          return true
        }),
      ) ?? []
    },
    [feedQuery.data],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !isFetchingNextPage &&
          !isFetchNextPageError
        ) {
          void fetchNextPage()
        }
      },
      { rootMargin: "600px 0px" },
    )
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  ])

  if (feedQuery.isPending) {
    return <div className="px-4 text-sm text-muted-foreground">Loading posts...</div>
  }

  if (feedQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 text-sm text-destructive">
        <span>Unable to load posts.</span>
        <Button variant="outline" onClick={() => void feedQuery.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (posts.length === 0) return <NoPostsFound />

  return (
    <div className="mb-12 flex flex-col gap-6 px-4">
      {posts.map((post) => (
        <Post key={post.post_id} feedItem={post} />
      ))}
      <div ref={sentinelRef} className="flex min-h-10 w-full justify-center">
        {isFetchingNextPage && (
          <span className="text-sm text-muted-foreground">Loading more...</span>
        )}
        {!hasNextPage && (
          <span className="text-sm text-muted-foreground">You&apos;re all caught up.</span>
        )}
        {isFetchNextPageError && (
          <Button variant="outline" onClick={() => void fetchNextPage()}>
            Try loading more
          </Button>
        )}
      </div>
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
