import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useGetPingQuery } from "@/hooks/queries/health-queries"
import { useEffect, useState } from "react"

export default function LoadingScreen() {
  const [progress, setProgress] = useState<number>(0)

  const healthQuery = useGetPingQuery()

  useEffect(() => {
    const durationMs = 60_000
    const tickMs = 100
    const increment = 100 / (durationMs / tickMs)

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        if (next >= 100 || healthQuery.isSuccess) {
          clearInterval(interval)
          return 100
        }
        return next
      })
    }, tickMs)

    return () => clearInterval(interval)
  }, [healthQuery.isSuccess])

  return (
    <div className="flex min-h-svh flex-col justify-between">
      <Progress className="rounded-none" value={progress} />
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-center text-2xl">
          <span className="linear bg-linear-to-br from-green-800 to-lime-600 bg-clip-text font-bold text-transparent">
            grapevine
          </span>{" "}
          is booting up, please wait...
        </h1>
        <p className="text-center text-muted-foreground">
          shouldn't take more than a minute!
        </p>
        <Spinner className="mt-4 size-16" />
      </div>
      <div></div>
    </div>
  )
}
