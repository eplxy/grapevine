import { getInitials } from "@/lib/utils/string-utils"
import type { ComponentProps } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

type UserAvatarProps = {} & ComponentProps<typeof Avatar>

export default function UserAvatar(props: UserAvatarProps) {
  const src = `https://cdn.discordapp.com/avatars/283015837936254976/29a3fa5619333d6e13865d9eb1ec1a04.webp`
  const fallbackName = "user name"
  const fallbackDisplay = getInitials(fallbackName)

  return (
    <Avatar {...props}>
      <AvatarImage src={src} />
      <AvatarFallback>{fallbackDisplay}</AvatarFallback>
    </Avatar>
  )
}
