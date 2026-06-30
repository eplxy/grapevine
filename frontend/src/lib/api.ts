import wretch, { type ConfiguredMiddleware } from "wretch"

let accessToken = ""

export const setAccessToken = (token: string) => {
  accessToken = token
}

const baseApi = wretch(
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).options({ credentials: "include" })

// 1. Extract the Token Injection into its own middleware
const injectToken: ConfiguredMiddleware = (next) => (url, opts) => {
  if (accessToken) {
    opts.headers = {
      ...opts.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }
  return next(url, opts)
}

// 2. Create the Silent Refresh Middleware
const handle401Retry: ConfiguredMiddleware = (next) => async (url, opts) => {
  try {
    // Attempt the original request
    return await next(url, opts)
  } catch (error: any) {
    // If it fails with a 401, intercept it here
    if (error.status === 401) {
      try {
        // Hit the Go backend refresh endpoint
        const { access_token } = await baseApi
          .url("/auth/refresh")
          .post()
          .json<{ access_token: string }>()

        setAccessToken(access_token)

        // Modify the options for the replay with the new token
        const retryOpts = {
          ...opts,
          headers: {
            ...opts.headers,
            Authorization: `Bearer ${access_token}`,
          },
        }

        // Replay the native request. Wretch handles the rest!
        return await next(url, retryOpts)
      } catch (refreshError) {
        // Refresh failed (cookie expired). Wipe state.
        setAccessToken("")
        throw refreshError
      }
    }

    // If it's a 500, 404, etc., just throw it normally
    throw error
  }
}

// 3. Apply both middlewares to your main instance
export const api = baseApi.middlewares([injectToken, handle401Retry])
