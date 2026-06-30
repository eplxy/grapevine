import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createFileRoute } from "@tanstack/react-router"
import logo from "@/assets/grapevine.svg"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { useState } from "react"
import { useLoginMutation } from "@/hooks/queries/user-queries"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
})

function RouteComponent() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")

  const loginMutation = useLoginMutation()

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    loginMutation.mutate({ name, password })
  }

  return (
    <div className="flex min-h-full w-full">
      <div className="flex w-full gap-4 p-4">
        <div className="flex h-full w-full flex-col items-center py-10 px-2 sm:px-10 md:w-[50%] md:px-10 lg:px-24">
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
                id="name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {/* <FieldError>Validation message.</FieldError> */}
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* <FieldError>Validation message.</FieldError> */}
            </Field>
            <Field className="mt-2">
              <Button onClick={handleSubmit}>Log in</Button>
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
