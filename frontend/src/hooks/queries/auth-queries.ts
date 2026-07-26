import { api, setAccessToken } from "@/lib/api"
import { useMutation, useQuery } from "@tanstack/react-query"
import { userKeys } from "./query-keys"
import { queryClient } from "@/router"
import { toast } from "react-toastify"
import { AUTH_STALE_TIME_MS } from "@/routes/__root"

export interface GetAuthSessionResponseModel {
  user_id: string
  username: string
  authenticated: boolean
}

export const useAuthSessionQuery = () => {
  return useQuery({
    queryKey: userKeys.session(),
    queryFn: async () => {
      return await api.url("/auth/me").get().json<GetAuthSessionResponseModel>()
    },
    retry: false,
    staleTime: AUTH_STALE_TIME_MS,
  })
}

interface PostLogoutResponseModel {
  message: string
}

export const useLogoutMutation = () => {
  return useMutation({
    mutationKey: userKeys.logout(),
    mutationFn: async () => {
      return await api
        .url("/auth/logout")
        .post()
        .json<PostLogoutResponseModel>()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
    onSettled: () => {
      console.log("setting setQueryData ")
      setAccessToken("")
      queryClient.setQueryData(userKeys.session(), {
        authenticated: false,
        user_id: "",
      })
    },
  })
}
