import AuthButton from "@/components/buttons/auth-button"
import PingButton from "@/components/buttons/ping-button"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Welcome home</h1>

      <PingButton />
      <AuthButton />
    </div>
  )
}
