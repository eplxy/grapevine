import { api } from "@/lib/api"
import type { FeedItemModel } from "@/models/models"
import { useMutation, useQuery } from "@tanstack/react-query"
import { postKeys } from "./query-keys"

import type { JSONContent } from "@tiptap/react"
import { toast } from "react-toastify"

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
