import logo from "@/assets/grapevine.svg"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRegisterMutation } from "@/hooks/queries/user-queries"
import { hasEmoji } from "@/lib/utils/string-utils"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { useState, type KeyboardEvent } from "react"

export const Route = createFileRoute("/(auth)/register")({
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
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("")
  const [submitOnCooldown, setSubmitOnCooldown] = useState<boolean>(false)

  const registrationMutation = useRegisterMutation()
  const registerErrorMessage = registrationMutation.error?.message

  const [isNameFieldError, setIsNameFieldError] = useState<boolean>(false)
  const [isPasswordFieldError, setIsPasswordFieldError] =
    useState<boolean>(false)
  const [
    isPasswordConfirmationFieldError,
    setIsPasswordConfirmationFieldError,
  ] = useState<boolean>(false)

  const handleSubmit = () => {
    registrationMutation.mutate({
      name,
      password,
    })
    setSubmitOnCooldown(true)
    setTimeout(() => setSubmitOnCooldown(false), 1000)
  }

  const getPasswordErrorText = () => {
    if (!password) return "Password is required"
    if (password.length < 8)
      return "Your password must be at least 8 characters long"
    if (hasEmoji(password)) return "Your password can't include emojis"
  }
  const getNameErrorText = () => {
    if (!name) return "Username is required"
    if (hasEmoji(name)) return "Usernames can't include emojis"
  }
  const isSubmitDisabled =
    !name ||
    !password ||
    password.length < 8 ||
    submitOnCooldown ||
    password !== passwordConfirmation ||
    hasEmoji(name) ||
    hasEmoji(password)

  const handleTextInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || isSubmitDisabled) return
    handleSubmit()
  }

  return (
    <div className="flex min-h-full w-full">
      <div className="flex w-full gap-4 p-4">
        <div className="flex h-full w-full flex-col items-center px-2 py-10 sm:px-10 md:w-[50%] md:px-10 lg:px-24">
          <div className="my-20 w-full">
            <h1 className="text-4xl">Create an account</h1>
            <h2 className="text-muted-foreground">
              Register now to write and read reviews posted by people you know.
            </h2>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Username</FieldLabel>
              <Input
                onBlur={() => {
                  setIsNameFieldError(name.length === 0 || hasEmoji(name))
                }}
                id="name"
                placeholder="a cool name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (isNameFieldError) setIsNameFieldError(false)
                }}
                onKeyDown={handleTextInputKeyDown}
              />
              <>
                {isNameFieldError ? (
                  <FieldError>
                    {getNameErrorText()}
                    {hasEmoji(name) && (
                      <span className="ml-2 text-xs text-muted-foreground italic">
                        lmaooo get fucked wells
                      </span>
                    )}
                  </FieldError>
                ) : null}
              </>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="your top secret password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (isPasswordFieldError) setIsPasswordFieldError(false)
                  setIsPasswordConfirmationFieldError(
                    passwordConfirmation !== e.target.value &&
                      !!passwordConfirmation
                  )
                }}
                onKeyDown={handleTextInputKeyDown}
                onBlur={() => {
                  setIsPasswordFieldError(password.length < 8)
                }}
              />
              {isPasswordFieldError ? (
                <FieldError>{getPasswordErrorText()}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Password</FieldLabel>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="your password (again)"
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value)
                  setIsPasswordConfirmationFieldError(
                    password !== e.target.value
                  )
                }}
                onKeyDown={handleTextInputKeyDown}
              />
              {isPasswordConfirmationFieldError ? (
                <FieldError>Passwords don't match</FieldError>
              ) : null}
            </Field>
            <Field className="mt-2">
              <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                Register
              </Button>
              {registerErrorMessage ? (
                <FieldError>{registerErrorMessage}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <Link to="/login" className="mt-4 w-full text-muted-foreground">
            Already have an account?{" "}
            <span className="text-accent-foreground">Login</span>
          </Link>
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
