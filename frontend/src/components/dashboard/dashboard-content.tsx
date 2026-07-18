import { useState, type MouseEvent } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import UserAvatar from "../user-avatar"
import PostList from "./post-list"
import CreateNoteDialog from "./create-note-dialog"
import { useAuthSessionQuery } from "@/hooks/queries/auth-queries"
import { useNavigate } from "@tanstack/react-router"

export default function DashboardContent() {
  return (
    <main className="flex min-h-screen w-full flex-col gap-4 pt-6 md:max-w-150">
      <NewPostBar />
      <FeedTypeSelect />
      <PostList />
    </main>
  )
}

function NewPostBar() {
  const navigate = useNavigate()
  const handleClick = (ev: MouseEvent<HTMLDivElement>) => {
    if (!isLoggedIn) {
      ev.preventDefault()
      navigate({ to: "/login" })
    }
  }

  const authSessionQuery = useAuthSessionQuery()
  const isLoggedIn = authSessionQuery.data?.authenticated === true

  const getText = (): string => {
    return isLoggedIn ? "What's new?" : "Log in to post on Grapevine"
  }

  return (
    <CreateNoteDialog
      triggerComponent={
        <div
          onClick={handleClick}
          className="mx-3 hidden min-h-16 items-center gap-4 rounded-lg border border-border bg-card px-4 shadow-xs hover:border-neutral-700 sm:flex"
        >
          <UserAvatar />
          <span className="text-muted-foreground">{getText()}</span>
        </div>
      }
    />
  )
}

function FeedTypeSelect() {
  const items = [
    { label: "Following", value: "Following" },
    { label: "All", value: "All" },
  ]

  const [value, setValue] = useState<string>("Following")

  return (
    <Select value={value} onValueChange={(val) => setValue(val)}>
      <SelectTrigger className="ml-3 hidden w-40 bg-card text-sm text-muted-foreground md:flex">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
