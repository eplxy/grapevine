import { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

export interface RouterContext {
  queryClient: QueryClient
  auth: {
    isAuthenticated: boolean
    userId?: string
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 0,
    },
    mutations: {
      retry: 0,
    },
  },
})

const initialRouterContext: RouterContext = {
  queryClient,
  auth: { isAuthenticated: false },
}

export const router = createRouter({
  routeTree,
  context: initialRouterContext,
  defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
