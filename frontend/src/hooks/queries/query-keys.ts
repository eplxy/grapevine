// SAMPLE provided by Google AI Overview
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: object) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

export const healthKeys = {
  ping: ["ping"] as const,
}

export const userKeys = {
  login: ["login"] as const,
  register: ["register"] as const,
  auth: ["auth"] as const,
  session: () => [...userKeys.auth, "session"] as const,
  logout: () => [...userKeys.auth, "logout"] as const,
}

export const postKeys = {
  posts: ["posts"] as const,
  getFeed: (limit: number, offset: number) => ["feed", limit, offset],
  uploadNote: () => [...postKeys.posts, "upload", "note"] as const,
}
