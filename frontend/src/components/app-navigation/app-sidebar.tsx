import logo from "@/assets/grapevine.svg"
import AuthButton from "@/components/buttons/auth-button"
import { Link, useLocation } from "@tanstack/react-router"
import { Home, Map, Menu, User } from "lucide-react"
import type { ReactNode } from "react"
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
} from "../ui/sidebar"

import NewPostButton from "../buttons/new-post-button"
import { DashboardSettingsPopover } from "./dash-settings-popover"

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
              <SidebarMenuButton asChild>
                <NewPostButton />
              </SidebarMenuButton>
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
  return (
    <SidebarMenuItem key={"More"}>
      <DashboardSettingsPopover
        triggerComponent={
          <SidebarMenuButton className="h-12 [&>svg]:size-6">
            <Menu />

            <span className="ml-2">More</span>
          </SidebarMenuButton>
        }
        side="right"
      />
    </SidebarMenuItem>
  )
}
