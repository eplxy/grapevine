import { useLoginMutation } from "@/hooks/queries/user-queries"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState, type KeyboardEvent } from "react"
import type { JSX } from "react/jsx-runtime"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

export default function LoginDialog({
  triggerComponent,
}: {
  triggerComponent: JSX.Element
}) {
  const [name, setName] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [submitOnCooldown, setSubmitOnCooldown] = useState<boolean>(false)
  const navigate = useNavigate()

  const loginMutation = useLoginMutation()
  const loginErrorMessage = loginMutation.error?.message

  const handleSubmit = () => {
    loginMutation.mutate(
      {
        name,
        password,
      },
      {
        onSuccess: () => {
          navigate({ to: "/", reloadDocument: true })
        },
      }
    )
    setSubmitOnCooldown(true)
    setTimeout(() => setSubmitOnCooldown(false), 1000)
  }

  const isSubmitDisabled =
    !name || !password || password.length < 8 || submitOnCooldown

  const handleTextInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || isSubmitDisabled) return
    handleSubmit()
  }

  return (
    <Dialog>
      {triggerComponent && (
        <DialogTrigger asChild>{triggerComponent}</DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log in</DialogTitle>
          <DialogDescription>
            You must log in to post on Grapevine.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Username</FieldLabel>
            <Input
              id="name"
              placeholder="a cool name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
              }}
              onKeyDown={handleTextInputKeyDown}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="your top secret password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              onKeyDown={handleTextInputKeyDown}
            />
          </Field>
          <Field className="mt-2">
            <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
              Log in
            </Button>
            {loginErrorMessage ? (
              <FieldError>{loginErrorMessage}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Link to="/register" className="mt-4 w-full text-muted-foreground">
            New to{" "}
            <span className="linear bg-linear-to-br from-green-800 to-lime-600 bg-clip-text text-transparent">
              grapevine
            </span>
            ? <span className="text-accent-foreground">Register here</span>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
