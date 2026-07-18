import logo from "@/assets/grapevine.svg"
import AuthButton from "@/components/buttons/auth-button"
import { Link, useLocation } from "@tanstack/react-router"
import { Home, Map, Menu, Moon, Pencil, Sun, SunMoon, User } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "./ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar"

import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTheme } from "./theme-provider"
import { Label } from "./ui/label"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import CreateNoteDialog from "./dashboard/create-note-dialog"

export interface NavMapItemModel {
  title: string
  route: string
  icon: ReactNode
}

export const NavigationMapping: NavMapItemModel[] = [
  { title: "Home", route: "/", icon: <Home /> },
  { title: "Map", route: "/map", icon: <Map /> },
  { title: "Profile", route: "/profile", icon: <User /> },
]

export function AppSidebar() {
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="mt-4 flex flex-row items-center gap-2 overflow-hidden p-2">
        <div className="flex gap-2 pl-1 align-middle">
          <img
            src={logo}
            alt="Grapevine logo"
            className="size-9 w-auto shrink-0 pt-1"
          />
          <span className="pt-2 pl-1 font-heading text-2xl transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            Grapevine
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="my-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NavigationMapping.map((item: NavMapItemModel) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="h-12 [&>svg]:size-6"
                    asChild
                    isActive={pathname.toLowerCase() == item.route}
                  >
                    <Link to={item.route}>
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <MorePopoverButton />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <CreateNoteDialog
                triggerComponent={
                  <SidebarMenuButton asChild>
                    <Button variant="outline" className="h-10">
                      <Pencil className="transition-all group-data-[collapsible=icon]:ml-2 group-data-[collapsible=icon]:size-5!" />
                      <span>New</span>
                    </Button>
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12">
              <AuthButton />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function MorePopoverButton() {
  const { theme, setTheme } = useTheme()

  return (
    <SidebarMenuItem key={"More"}>
      <Popover>
        <PopoverTrigger asChild>
          <SidebarMenuButton className="h-12 [&>svg]:size-6">
            <Menu />

            <span className="ml-2">More</span>
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent side="right">
          <PopoverTitle>Extra options</PopoverTitle>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label>Display theme</Label>
                <ToggleGroup
                  type="single"
                  defaultValue={theme || "system"}
                  onValueChange={setTheme}
                >
                  <ToggleGroupItem
                    title="Light"
                    value="light"
                    aria-label="Toggle light"
                  >
                    <Sun />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    title="Dark"
                    value="dark"
                    aria-label="Toggle dark"
                  >
                    <Moon />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    title="System Default"
                    value="system"
                    aria-label="Toggle system default"
                  >
                    <SunMoon />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  )
}
