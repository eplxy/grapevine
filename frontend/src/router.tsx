import { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

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

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
