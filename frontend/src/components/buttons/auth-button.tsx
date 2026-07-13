import {
  useAuthSessionQuery,
  useLogoutMutation,
} from "@/hooks/queries/auth-queries"
import { Button } from "../ui/button"
import type { ComponentPropsWithRef, ReactNode } from "react"
import { LogIn, LogOut } from "lucide-react"

type AuthButtonProps = {
  loggedInComponent?: ReactNode
  hideIfLoggedIn?: boolean
} & ComponentPropsWithRef<"button">

export default function AuthButton(props: AuthButtonProps) {
  const { hideIfLoggedIn, loggedInComponent, ...rest } = props
  const authSessionQuery = useAuthSessionQuery()
  const logoutMutation = useLogoutMutation()

  const isLoggedIn = authSessionQuery.data?.authenticated === true
  const isLoggingOut = logoutMutation.isPending

  if (!isLoggedIn) {
    return (
      <Button variant="secondary" asChild {...rest}>
        <a href="/login">
          <LogIn />
          <span>Log in</span>
        </a>
      </Button>
    )
  } else if (hideIfLoggedIn) {
    return null
  }

  if (loggedInComponent) return loggedInComponent

  return (
    <Button
      variant="secondary"
      onClick={() => logoutMutation.mutate()}
      disabled={isLoggingOut}
      {...rest}
    >
      <LogOut />
      {isLoggingOut ? "Logging out..." : "Log out"}
    </Button>
  )
}
