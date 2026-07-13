import { type GetAuthSessionResponseModel } from "@/hooks/queries/auth-queries"
import { userKeys } from "@/hooks/queries/query-keys"
import { api, baseApi, setAccessToken } from "@/lib/api"
import type { RouterContext } from "@/router"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"

export const AUTH_STALE_TIME_MS = 1000 * 60 * 5

const initializeAuthSession =
  async (): Promise<GetAuthSessionResponseModel> => {
    try {
      const res = await baseApi
        .url("/auth/refresh")
        .post()
        .json<{ access_token: string }>()
      if (!res.access_token) {
        // refresh failed, user is logged out
        return { authenticated: false, user_id: "" }
      }

      // refresh token exists
      setAccessToken(res.access_token)

      return await api.url("/auth/me").get().json<GetAuthSessionResponseModel>()
    } catch (error) {
      console.error("Initialization failed:", error)
      return { authenticated: false, user_id: "" }
    }
  }

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      queryKey: userKeys.session(),
      queryFn: initializeAuthSession,
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
    </>
  )
}
