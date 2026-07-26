import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
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
  return <div>Hello "/profile"!</div>
}
