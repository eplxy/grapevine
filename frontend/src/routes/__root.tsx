import {
  AUTH_STALE_TIME_MS,
  type GetAuthSessionResponseModel,
} from "@/hooks/queries/auth-queries"
import { userKeys } from "@/hooks/queries/query-keys"
import { api } from "@/lib/api"
import type { RouterContext } from "@/router"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

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
      staleTime: AUTH_STALE_TIME_MS,
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
