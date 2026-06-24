import { getPingQuery } from "@/hooks/queries/health-queries"
import { Button } from "../ui/button"

export default function PingButton() {
  const pingQuery = getPingQuery({ waitForClick: true })
  const getDisplayText = (): string => {
    return pingQuery.data?.message || "ping"
  }

  return <Button onClick={() => pingQuery.refetch()}>{getDisplayText()}</Button>
}
