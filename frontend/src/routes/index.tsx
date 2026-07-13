import { AppSidebar } from "@/components/app-sidebar"
import { MobileBottomNav } from "@/components/mobile-navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { SidebarProvider } from "@/components/ui/sidebar"
import { createFileRoute } from "@tanstack/react-router"
import { Heart, MessageCircle, Share } from "lucide-react"

export const Route = createFileRoute("/")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider
      defaultOpen={window.matchMedia(`(min-width: 1280px)`).matches}
    >
      <div className="mx-auto flex w-full max-w-300 justify-center">
        <AppSidebar />
        {/* main container*/}
        <main className="flex min-h-screen w-full flex-col md:max-w-150">

          <div className="flex flex-col gap-6 p-4">
            {/* Map through your posts here */}
            {[1, 2, 3, 4].map((post) => (
              <Card
                key={post}
                className="rounded-none border-b border-none pb-4 shadow-none"
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://cdn.discordapp.com/avatars/283015837936254976/29a3fa5619333d6e13865d9eb1ec1a04.webp`} />
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Username</span>
                    <span className="text-xs text-muted-foreground">
                      2 hours ago
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="mb-4 text-sm">
                    This is the main scrollable content area. yip yap yappity yappy yap yap
                  </p>
                  <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted">
                    Image Placeholder
                  </div>
                </CardContent>
                <CardFooter className="flex gap-6 text-muted-foreground">
                  <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
                    <Heart className="h-5 w-5" /> 1.2k
                  </button>
                  <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
                    <MessageCircle className="h-5 w-5" /> 48
                  </button>
                  <button className="flex items-center gap-2 text-sm transition-colors hover:text-foreground">
                    <Share className="h-5 w-5" />
                  </button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
        <aside className="sticky top-0 hidden h-screen w-[320px] flex-col px-6 py-6 xl:flex"></aside>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  )
}
