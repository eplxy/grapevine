import wretch, { type ConfiguredMiddleware } from "wretch"
import { queryStringAddon } from "wretch/addons";

let accessToken = ""

export const setAccessToken = (token: string) => {
  accessToken = token
}

export const baseApi = wretch(
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).options({ credentials: "include" }).addon(queryStringAddon)

const injectToken: ConfiguredMiddleware = (next) => (url, opts) => {
  if (accessToken) {
    opts.headers = {
      ...opts.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }
  return next(url, opts)
}

let refreshPromise: Promise<string> | null = null

const handle401Retry: ConfiguredMiddleware = (next) => async (url, opts) => {
  const res = await next(url, opts)

  if (res.status === 401) {
    try {
      if (!refreshPromise) {
        refreshPromise = baseApi
          .url("/auth/refresh")
          .post()
          .json<{ access_token: string }>()
          .then((data) => {
            if (!data.access_token) {
              throw new Error("Silent refresh failed")
            }
            setAccessToken(data.access_token)
            return data.access_token
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newAccessToken = await refreshPromise

      const retryOpts = {
        ...opts,
        headers: {
          ...opts.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      }

      return await next(url, retryOpts)
    } catch (refreshError) {
      setAccessToken("")

      return res
    }
  }
  return res
}

export const api = baseApi.middlewares([injectToken, handle401Retry])
