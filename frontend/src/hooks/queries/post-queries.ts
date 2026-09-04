import { api } from "@/lib/api"
import type { FeedItemModel } from "@/models/models"
import { useMutation, useQuery } from "@tanstack/react-query"
import { postKeys } from "./query-keys"
import { useNavigate } from "@tanstack/react-router"

import type { JSONContent } from "@tiptap/react"
import { toast } from "react-toastify"
import type { LocationAutocompleteSuggestion } from "@/models/models"

export const useFeedQuery = (limit: number, offset: number) => {
  return useQuery({
    queryKey: postKeys.getFeed(limit, offset),
    queryFn: () =>
      api
        .url("/posts")
        .query({ limit, offset })
        .get()
        .json<FeedItemModel[]>((res) => res.data),
    retry: false,
    staleTime: Infinity,
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
  return useMutation({
    mutationKey: postKeys.uploadNote(),
    mutationFn: (body: PostUploadNoteRequestModel) =>
      api.url("/posts/note").post(body).json<PostUploadNoteResponseModel>(),
    onSuccess: (res) => {
      toast.success(res.message)
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
      navigate({ to: `/` })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })
}
