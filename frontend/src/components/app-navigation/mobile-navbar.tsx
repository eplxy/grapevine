import { Link } from "@tanstack/react-router"
import { Menu, Pencil } from "lucide-react"
import NewPostButton from "../buttons/new-post-button"
import { Button } from "../ui/button"
import { NavigationMapping, type NavMapItemModel } from "./app-sidebar"
import { DashboardSettingsPopover } from "./dash-settings-popover"

export function MobileBottomNav() {
  return (
    <nav className="z-50 flex min-h-16 items-center justify-around border-t bg-background px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
      <NavButton item={NavigationMapping[0]} />
      <NavButton item={NavigationMapping[1]} />
      <NewPostButton popoverSide="top">
        <Button className="h-12 w-14" size="lg" variant={"secondary"} asChild>
          <Pencil className="w-14" />
        </Button>
      </NewPostButton>
      <NavButton item={NavigationMapping[2]} />
      <DashboardSettingsPopover
        triggerComponent={
          <Button
            variant={"ghost"}
            size={"icon-lg"}
            asChild
            className="p-1 text-muted-foreground"
          >
            <Menu />
          </Button>
        }
        side="top"
      />
    </nav>
  )
}

function NavButton(props: { item: NavMapItemModel }) {
  return (
    <Link
      key={props.item.title}
      to={props.item.route}
      activeProps={{ className: "text-primary" }}
      inactiveProps={{ className: "text-muted-foreground" }}
      className="p-2"
    >
      {props.item.icon}
    </Link>
  )
}
