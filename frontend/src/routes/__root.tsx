import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { userKeys } from "@/hooks/queries/query-keys"
import { api } from "@/lib/api"
import type { GetAuthSessionResponseModel } from "@/hooks/queries/auth-queries"

export interface RouterContext {
  queryClient: QueryClient
  auth: {
    isAuthenticated: boolean
    userId?: string
  }
}

const fetchAuthSession = async () => {
  try {
    return await api.url("/auth/me").get().json<GetAuthSessionResponseModel>()
  } catch (error) {
    return { authenticated: false, user_id: "" }
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      queryKey: userKeys.session(),
      queryFn: fetchAuthSession,
    })

    return {
      auth: {
        isAuthenticated: session.authenticated,
        userId: session.user_id,
      },
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="flex min-h-svh">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  )
}
