import { ThemeProvider } from "@/components/theme-provider.tsx"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import WrappedToastContainer from "./components/toast-container"
import { TooltipProvider } from "./components/ui/tooltip"
import "./index.css"
import { queryClient, router } from "./router"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WrappedToastContainer stacked={true} />
          <RouterProvider router={router} />
          {/*<ReactQueryDevtools initialIsOpen={false} />*/}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
