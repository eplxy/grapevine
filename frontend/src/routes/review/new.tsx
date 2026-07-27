import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/review/new")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">

      </div>
    </div>
  )
}
