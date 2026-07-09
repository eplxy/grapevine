import logo from "@/assets/grapevine.svg"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLoginMutation } from "@/hooks/queries/user-queries"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState, type KeyboardEvent } from "react"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        replace: true,
      })
    }
  },
})

function RouteComponent() {
  const [name, setName] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [submitOnCooldown, setSubmitOnCooldown] = useState<boolean>(false)
  const navigate = useNavigate()

  const loginMutation = useLoginMutation()
  const loginErrorMessage = loginMutation.error?.message

  const [isNameFieldError, setIsNameFieldError] = useState<boolean>(false)
  const [isPasswordFieldError, setIsPasswordFieldError] =
    useState<boolean>(false)

  const handleSubmit = () => {
    loginMutation.mutate(
      {
        name,
        password,
      },
      {
        onSuccess: () => {
          navigate({ to: "/", replace: true })
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
    <div className="flex min-h-full w-full">
      <div className="flex w-full gap-4 p-4">
        <div className="flex h-full w-full flex-col items-center px-2 py-10 sm:px-10 md:w-[50%] md:px-10 lg:px-24">
          <div className="my-20 w-full">
            <h1 className="text-4xl">Welcome back</h1>
            <h2 className="text-muted-foreground">
              Sign in to your existing account to write and view reviews.
            </h2>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Username</FieldLabel>
              <Input
                onBlur={() => {
                  setIsNameFieldError(name.length === 0)
                }}
                id="name"
                placeholder="Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (isNameFieldError) setIsNameFieldError(false)
                }}
                onKeyDown={handleTextInputKeyDown}
              />
              {isNameFieldError ? (
                <FieldError>Username is required</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (isPasswordFieldError) setIsPasswordFieldError(false)
                }}
                onKeyDown={handleTextInputKeyDown}
                onBlur={() => {
                  setIsPasswordFieldError(password.length === 0)
                }}
              />
              {isPasswordFieldError ? (
                <FieldError>Password is required</FieldError>
              ) : null}
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
        </div>
        <div className="hidden h-full w-[50%] md:flex">
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted">
            <div className="flex flex-col gap-2 select-none">
              <img src={logo} alt="Grapevine logo" className="h-32 w-auto" />
              <span className="text-muted-foreground italic">
                what did you hear through the grapevine?
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
