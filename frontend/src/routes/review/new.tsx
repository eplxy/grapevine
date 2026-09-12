import LocationSelector from "@/components/review/location-selector"
import ReviewForm from "@/components/review/review-form"
import { Button } from "@/components/ui/button"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

export const Route = createFileRoute("/review/new")({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden py-4">
      <nav className="mb-2 flex h-auto flex-row items-center gap-2 border-b px-4 pb-2">
        <Button
          variant="ghost"
          size={"icon"}
          onClick={() => router.history.back()}
        >
          <ChevronLeft />
        </Button>
        <span className="text-lg">New review</span>
      </nav>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <div className="rounded-xl bg-card p-4">
          <LocationSelector />
        </div>
        <div className="rounded-xl bg-card p-4">
          <ReviewForm />
        </div>
      </div>
    </div>
  )
}
