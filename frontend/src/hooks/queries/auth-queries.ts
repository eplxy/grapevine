import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { userKeys } from "./query-keys"

export interface GetAuthSessionResponseModel {
  user_id: string
  authenticated: boolean
}

export const useAuthSessionQuery = () => {
  return useQuery({
    queryKey: userKeys.session(),
    queryFn: async () => {
      return await api.url("/auth/me").get().json<GetAuthSessionResponseModel>()
    },
    retry: false,
  })
}
