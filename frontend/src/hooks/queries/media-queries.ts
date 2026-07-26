import { useMutation, useQuery } from "@tanstack/react-query"
import { mediaKeys } from "./query-keys"
import { api } from "@/lib/api"
import wretch from "wretch"

type GetMediaUploadURLResponseModel = {
  publicUrl: string
  signedUrl: string
}

export const useUploadMediaToStorage = (file: File) => {
  return useMutation({
    mutationKey: mediaKeys.upload(file),
    mutationFn: async () => {
      const { signedUrl, publicUrl } = await api
        .url("/media/upload-url")
        .query({ fileName: file.name, contentType: file.type })
        .get()
        .json<GetMediaUploadURLResponseModel>()

      await wretch(signedUrl)
        .content(file.type)
        .put(file)
        .res((response) => response.text)
      return publicUrl
    },
    retry: 0,
  })
}



export const useUploadMediaToStorageQuery = (file: File) => {
  return useQuery({
    queryKey: mediaKeys.upload(file),
    queryFn: async () => {
      const { signedUrl, publicUrl } = await api
        .url("/media/upload-url")
        .query({ fileName: file.name, contentType: file.type })
        .get()
        .json<GetMediaUploadURLResponseModel>()

      await wretch(signedUrl)
        .content(file.type)
        .put(file)
        .res((response) => response.text)
      return publicUrl
    },
    retry: 0,
    staleTime: Infinity
  })
}
