import UnderConstruction from "@/components/app-navigation/under-contstruction"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        replace: true,
      })
    }
  },
})

function RouteComponent() {
  return <UnderConstruction />
}
