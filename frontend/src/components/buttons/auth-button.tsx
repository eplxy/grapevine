import { useAuthSessionQuery } from "@/hooks/queries/auth-queries"
import { buttonVariants } from "../ui/button"

export default function AuthButton() {
  const authSessionQuery = useAuthSessionQuery()

  const isLoggedIn = authSessionQuery.data?.authenticated === true
  const href = isLoggedIn ? "/" : "/login"
  const text = isLoggedIn ? "Logged in" : "Log in"

  return (
    <a href={href} className={buttonVariants()}>
      {text}
    </a>
  )
}
