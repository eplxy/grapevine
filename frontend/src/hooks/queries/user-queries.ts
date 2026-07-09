import { api } from "@/lib/api"
import { setAccessToken } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/router"
import { userKeys } from "./query-keys"
import { toast } from "react-toastify"
import { getErrorMessage } from "@/lib/utils/error-utils"

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
    mutationFn: async (body: PostLoginRequestModel) => {
      try {
        return await api
          .url("/auth/login")
          .post(body)
          .json<PostLoginResponseModel>()
      } catch (err) {
        throw new Error(getErrorMessage(err))
      }
    },
    onSuccess: ({ access_token }) => {
      setAccessToken(access_token)
      queryClient.invalidateQueries({ queryKey: userKeys.session() })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
