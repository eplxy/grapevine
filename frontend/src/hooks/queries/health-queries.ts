import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { healthKeys } from "./query-keys"

export interface GetPingResponseModel {
  message: string
}

export const healthQueryOptions = {
  queryKey: healthKeys.ping,
  queryFn: () => api.url("/ping").get().json<GetPingResponseModel>(),
  staleTime: 1000 * 60 * 15, // matches render sleep time
}

export const useGetPingQuery = () => {
  return useQuery(healthQueryOptions)
}
