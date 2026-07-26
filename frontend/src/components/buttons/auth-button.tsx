import {
  useAuthSessionQuery,
  useLogoutMutation,
} from "@/hooks/queries/auth-queries"
import { useNavigate } from "@tanstack/react-router"
import { Loader, LogIn, LogOut } from "lucide-react"
import type { ComponentPropsWithRef, ReactNode } from "react"
import { Button } from "../ui/button"

type AuthButtonProps = {
  loggedInComponent?: ReactNode
  hideIfLoggedIn?: boolean
} & ComponentPropsWithRef<"button">

export default function AuthButton(props: AuthButtonProps) {
  const { hideIfLoggedIn, loggedInComponent, ...rest } = props
  const authSessionQuery = useAuthSessionQuery()
  const logoutMutation = useLogoutMutation()
  const navigate = useNavigate()

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
      {isLoggingOut ? <Loader /> : <LogOut />}
      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
    </Button>
  )
}
