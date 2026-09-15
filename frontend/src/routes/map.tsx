import UnderConstruction from "@/components/app-navigation/under-contstruction"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/map")({
  component: RouteComponent,
})

function RouteComponent() {
  return <UnderConstruction />
}
