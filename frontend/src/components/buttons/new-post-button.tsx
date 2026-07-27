import { useAuthSessionQuery } from "@/hooks/queries/auth-queries"
import { MessageSquareHeart, Pencil, SquarePen } from "lucide-react"
import { useState, type ComponentPropsWithRef, type ReactNode } from "react"
import CreateNoteDialog from "../dashboard/create-note-dialog"
import LoginDialog from "../dialog/login-dialog"
import { Button } from "../ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover"

export type NewPostButtonProps = {
  popoverSide?: "top" | "right" | "bottom" | "left"
} & ComponentPropsWithRef<typeof Button>
export default function NewPostButton(props: NewPostButtonProps) {
  const { popoverSide, ...rest } = props

  const sessionQuery = useAuthSessionQuery()
  const isLoggedIn = sessionQuery.data?.authenticated === true

  const buttonComponent = props.children || (
    <Button variant="outline" className="h-10" {...rest}>
      <Pencil className="transition-all group-data-[collapsible=icon]:ml-2 group-data-[collapsible=icon]:size-5!" />
      <span>New</span>
    </Button>
  )

  if (!isLoggedIn) {
    return (
      <>
        <LoginDialog triggerComponent={buttonComponent} />
      </>
    )
  }

  return (
    <NewPostTypePopover side={popoverSide} triggerComponent={buttonComponent} />
  )
}

export type NewPostTypePopoverProps = {
  triggerComponent?: ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export function NewPostTypePopover(props: NewPostTypePopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState<boolean>(false)

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild={!!props.triggerComponent}>
          {props.triggerComponent || <Button>New</Button>}
        </PopoverTrigger>
        <PopoverContent side={props.side || "right"} sideOffset={16}>
          <PopoverTitle>New post</PopoverTitle>
          <Button>
            <MessageSquareHeart />
            Review
          </Button>
          <Button onClick={() => setIsNoteDialogOpen(true)}>
            <SquarePen />
            Note
          </Button>
        </PopoverContent>
      </Popover>

      <CreateNoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
      />
    </>
  )
}
