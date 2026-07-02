import wretch, { type ConfiguredMiddleware } from "wretch"

let accessToken = ""

export const setAccessToken = (token: string) => {
  accessToken = token
}

const baseApi = wretch(
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).options({ credentials: "include" })

const injectToken: ConfiguredMiddleware = (next) => (url, opts) => {
  if (accessToken) {
    opts.headers = {
      ...opts.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }
  return next(url, opts)
}

const handle401Retry: ConfiguredMiddleware = (next) => async (url, opts) => {
  try {
    return await next(url, opts)
  } catch (error: any) {
    if (error.status === 401) {
      try {
        const { access_token } = await baseApi
          .url("/auth/refresh")
          .post()
          .json<{ access_token: string }>()

        setAccessToken(access_token)

        const retryOpts = {
          ...opts,
          headers: {
            ...opts.headers,
            Authorization: `Bearer ${access_token}`,
          },
        }

        return await next(url, retryOpts)
      } catch (refreshError) {
        setAccessToken("")
        throw refreshError
      }
    }

    throw error
  }
}

export const api = baseApi.middlewares([injectToken, handle401Retry])
