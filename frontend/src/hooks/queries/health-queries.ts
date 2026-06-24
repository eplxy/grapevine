import { api } from "@/lib/api"
import { healthKeys } from "./query-keys"
import { useQuery } from "@tanstack/react-query"

export interface GetPingResponseModel {
  message: string
}

export const getPingQuery = ({ waitForClick }: { waitForClick: boolean }) => {
  return useQuery({
    queryKey: healthKeys.ping,
    queryFn: () => api().get("/ping").json<GetPingResponseModel>(),
    enabled: !waitForClick,
  })
}
