import { Link } from "@tanstack/react-router"
import { Menu, Pencil } from "lucide-react"
import { NavigationMapping, type NavMapItemModel } from "./app-sidebar"
import { Button } from "./ui/button"
import CreateNoteDialog from "./dashboard/create-note-dialog"

export function MobileBottomNav() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 mb-4 md:hidden">
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
      <Button
        variant={"ghost"}
        size={"icon-lg"}
        asChild
        className="p-1 text-muted-foreground"
      >
        <Menu />
      </Button>
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
