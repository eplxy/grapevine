import { api } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { userKeys } from "./query-keys"
import { toast } from "react-toastify"

export interface PostLoginRequestModel {
  name: string
  password: string
}

export interface PostLoginResponseModel {
  access_token: string
  user_id: string
}

export const useLoginMutation = () => {
  return useMutation({
    mutationKey: userKeys.login,
    mutationFn: (body: PostLoginRequestModel) =>
      api.url("/auth/login").post(body).json<PostLoginResponseModel>(),
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
