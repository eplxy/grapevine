// src/components/layout/MobileBottomNav.tsx
import { Link } from "@tanstack/react-router"
import { NavigationMapping, type NavMapItemModel } from "./app-sidebar"

export function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4">
      {NavigationMapping.map((item: NavMapItemModel) => (
        <Link
          key={item.title}
          to={item.route}
          activeProps={{ className: "text-primary" }}
          inactiveProps={{ className: "text-muted-foreground" }}
          className="flex flex-col items-center justify-center gap-1 p-2"
        >
          {item.icon}
        </Link>
      ))}
    </nav>
  )
}
