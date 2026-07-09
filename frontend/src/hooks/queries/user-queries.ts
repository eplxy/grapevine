import { api } from "@/lib/api"
import { setAccessToken } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/router"
import { userKeys } from "./query-keys"
import { toast } from "react-toastify"
import { getErrorMessage } from "@/lib/utils/error-utils"
import { useNavigate } from "@tanstack/react-router"

export interface PostLoginRequestModel {
  name: string
  password: string
}

export interface PostLoginResponseModel {
  access_token: string
  user_id: string
}

export interface PostRegisterRequestModel {
  name: string
  password: string
}

export interface PostRegisterResponseModel {
  user_id: string
  message: string
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
  })
}

export const useRegisterMutation = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationKey: userKeys.register,
    mutationFn: async (body: PostRegisterRequestModel) => {
      try {
        return await api
          .url("/auth/register")
          .post(body)
          .json<PostRegisterResponseModel>()
      } catch (err) {
        throw new Error(getErrorMessage(err))
      }
    },
    onSuccess: () => {
      toast.success(
        "Registered successfully! Redirecting to login page shortly."
      )
      setTimeout(() => {
        navigate({ to: "/login" })
      }, 3000)
    },
  })
}
