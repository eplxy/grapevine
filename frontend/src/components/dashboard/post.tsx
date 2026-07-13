import { Heart, MessageCircle, Share } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import UserAvatar from "../user-avatar"

type PostProps = {
  key: string | number
}

export default function Post(props: PostProps) {
  return (
    <Card
      key={props.key}
      className="rounded-none border-b border-none pb-4 shadow-none"
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar/>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Username</span>
          <span className="text-xs text-muted-foreground">2 hours ago</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="mb-4 text-sm">
          This is the main scrollable content area. yip yap yappity yappy yap
          yap
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
  )
}
