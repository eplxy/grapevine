import {
  useAuthSessionQuery,
  useLogoutMutation,
} from "@/hooks/queries/auth-queries"
import { Button } from "../ui/button"

export default function AuthButton() {
  const authSessionQuery = useAuthSessionQuery()
  const logoutMutation = useLogoutMutation()

  const isLoggedIn = authSessionQuery.data?.authenticated === true
  const isLoggingOut = logoutMutation.isPending

  if (!isLoggedIn) {
    return (
      <Button asChild>
        <a href="/login">Log in</a>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={() => logoutMutation.mutate()}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Logging out..." : "Log out"}
    </Button>
  )
}
