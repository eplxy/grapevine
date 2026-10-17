import DashboardContent from "@/components/dashboard/dashboard-content"
import DashboardRightPanel from "@/components/dashboard/dashboard-right-panel"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <DashboardContent />
      <DashboardRightPanel />
    </>
  )
}
