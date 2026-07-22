import { Link } from "@tanstack/react-router"
import { Menu, Pencil } from "lucide-react"
import {
  DashboardSettingsPopover,
  NavigationMapping,
  type NavMapItemModel,
} from "./app-sidebar"
import CreateNoteDialog from "./dashboard/create-note-dialog"
import { Button } from "./ui/button"

export function MobileBottomNav() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 md:hidden">
      <NavButton item={NavigationMapping[0]} />
      <NavButton item={NavigationMapping[1]} />
      <CreateNoteDialog
        triggerComponent={
          <Button className="h-12 w-14" size="lg" variant={"secondary"} asChild>
            <Pencil className="w-14" />
          </Button>
        }
      />
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
