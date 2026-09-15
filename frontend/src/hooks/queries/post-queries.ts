import { api } from "@/lib/api"
import type { FeedItemModel } from "@/models/models"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { postKeys } from "./query-keys"
import { useNavigate } from "@tanstack/react-router"

import type { JSONContent } from "@tiptap/react"
import { toast } from "react-toastify"
import type { LocationAutocompleteSuggestion } from "@/models/models"

const FEED_PAGE_SIZE = 10

interface FeedPageResponse {
  data: FeedItemModel[]
  pagination: {
    has_more: boolean
    next_cursor: string
  }
}

export const useFeedInfiniteQuery = () => {
  return useInfiniteQuery({
    queryKey: postKeys.getFeed(),
    initialPageParam: "",
    queryFn: ({ pageParam }) =>
      api
        .url("/posts")
        .query({ limit: FEED_PAGE_SIZE, ...(pageParam ? { cursor: pageParam } : {}) })
        .get()
        .json<FeedPageResponse>(),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_more ? lastPage.pagination.next_cursor : undefined,
    retry: false,
    staleTime: 30_000,
  })
}

interface PostUploadNoteRequestModel {
  content: JSONContent // tiptap json schema
  text_content: string
  media_urls: string[]
}
interface PostUploadNoteResponseModel {
  post_id: number
  message: string
}

export const useUploadNoteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: postKeys.uploadNote(),
    mutationFn: (body: PostUploadNoteRequestModel) =>
      api.url("/posts/note").post(body).json<PostUploadNoteResponseModel>(),
    onSuccess: (res) => {
      toast.success(res.message)
      void queryClient.invalidateQueries({ queryKey: postKeys.feed })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })
}

interface PostUploadReviewRequestModel {
  content: JSONContent
  text_content: string
  rating: number
  media_urls: string[]
  location: {
    google_place_id: string
    name: string
    address: string
    type: string
    lat: number
    lng: number
  }
}

interface PostUploadReviewResponseModel {
  post_id: number
  message: string
}

export const useUploadReviewMutation = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: postKeys.uploadReview(),
    mutationFn: ({
      location,
      ...body
    }: Omit<PostUploadReviewRequestModel, "location"> & {
      location: LocationAutocompleteSuggestion
    }) =>
      api
        .url("/posts/review")
        .post({
          ...body,
          location: {
            google_place_id: location.place_id,
            name: location.name,
            address: location.address,
            type: location.types?.[0] || "",
            lat: location.lat || 0,
            lng: location.lng || 0,
          },
        })
        .json<PostUploadReviewResponseModel>(),
    onSuccess: (res) => {
      toast.success(res.message)
      void queryClient.invalidateQueries({ queryKey: postKeys.feed })
      navigate({ to: `/` })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })
}

export const useDeletePostMutation = (postId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: postKeys.deletePost(postId),
    mutationFn: () =>
      api
        .url(`/posts/${postId}`)
        .delete()
        .json<PostUploadReviewResponseModel>(),
    onSuccess: (res) => {
      toast.success(res.message)
      queryClient.invalidateQueries({ queryKey: ["feed"] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })
}
