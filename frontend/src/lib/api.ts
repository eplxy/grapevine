import wretch from "wretch"
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

export const api = () => {
  const jwt = localStorage.getItem("accessToken")

  if (!jwt) {
    return wretch(API_BASE_URL)
  }

  return wretch(API_BASE_URL).headers({ Authorization: `Bearer ${jwt}` })
}
