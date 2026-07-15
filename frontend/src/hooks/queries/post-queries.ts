import { api } from "@/lib/api"
import type { FeedItemModel } from "@/models/models"
import { useQuery } from "@tanstack/react-query"
import { postKeys } from "./query-keys"

export const useFeedQuery = (limit: number, offset: number) => {
  return useQuery({
    queryKey: postKeys.getFeed(limit, offset),
    queryFn: () =>
      api.url("/posts").query({ limit, offset }).get().json<FeedItemModel[]>((res) => (res.data)),
    retry: false,
    staleTime: Infinity,
  })
}
