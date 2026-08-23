import LoadingScreen from "@/components/loading-screen"
import { type GetAuthSessionResponseModel } from "@/hooks/queries/auth-queries"
import { healthQueryOptions } from "@/hooks/queries/health-queries"
import { userKeys } from "@/hooks/queries/query-keys"
import { api, baseApi, setAccessToken } from "@/lib/api"
import type { RouterContext } from "@/router"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import type { WretchError } from "wretch"

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
        return { authenticated: false, user_id: "", username: "" }
      }

      // refresh token exists
      setAccessToken(res.access_token)

      return await api.url("/auth/me").get().json<GetAuthSessionResponseModel>()
    } catch (error) {
      const we = error as WretchError
      if (we.status) {
        const isServerError = we.status >= 500

        const isNetworkError =
          !we.status &&
          (we?.name === "WretchError" || we?.message?.includes("fetch"))

        if (isServerError || isNetworkError) {
          throw error
        }
      }
      console.error("Initialization failed:", error)
      return { authenticated: false, user_id: "", username: "" }
    }
  }

export const Route = createRootRouteWithContext<RouterContext>()({
  pendingMs: 0,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      queryKey: userKeys.session(),
      queryFn: initializeAuthSession,
      staleTime: AUTH_STALE_TIME_MS,
      retry: true,
    })

    return {
      auth: {
        isAuthenticated: session.authenticated,
        userId: session.user_id,
      },
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      ...healthQueryOptions,
      retry: true,
    }),
  pendingComponent: () => <LoadingScreen />,
  component: RootComponent,
  errorComponent: ({ error }) => (
    <div className="flex min-h-svh items-center justify-center">
      <p>Failed to connect to the server.</p>
      <p className="text-red-400">{error.message}</p>
    </div>
  ),
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
