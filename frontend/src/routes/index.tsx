import { AppSidebar } from "@/components/app-navigation/app-sidebar"
import DashboardContent from "@/components/dashboard/dashboard-content"
import DashboardRightPanel from "@/components/dashboard/dashboard-right-panel"
import { MobileBottomNav } from "@/components/app-navigation/mobile-navbar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider
      defaultOpen={window.matchMedia(`(min-width: 1280px)`).matches}
    >
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-300 justify-center">
            <AppSidebar />
            <DashboardContent />
            <DashboardRightPanel />
          </div>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  )
}
