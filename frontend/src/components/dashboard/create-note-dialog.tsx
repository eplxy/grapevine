import {
  useAuthSessionQuery,
  type GetAuthSessionResponseModel,
} from "@/hooks/queries/auth-queries"
import type { JSX } from "react/jsx-runtime"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog"
import UserAvatar from "../user-avatar"

import { Placeholder } from "@tiptap/extensions"
import { EditorContent, useEditor } from "@tiptap/react"

import StarterKit from "@tiptap/starter-kit"
import clsx from "clsx"
import {
  Bold,
  Image,
  Italic,
  List,
  Maximize2,
  Minimize2,
  Strikethrough,
} from "lucide-react"
import { useState, type Dispatch, type SetStateAction } from "react"
import { Button } from "../ui/button"
import { Toggle } from "../ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

type CreateNoteDialogProps = {
  triggerComponent?: JSX.Element
}

const placeholders: string[] = [
  "What's new?",
  "Write about a restaurant you visited recently",
  "What new places have you tried recently?",
  "Any new restaurants worth recommending?",
  "A nice cafe you found recently...",
  "A nice restaurant you found recently...",
  "A spot you keep going back to...",
]

const getRandomPlaceholder = () => {
  return placeholders[Math.floor(Math.random() * placeholders.length)]
}

export default function CreateNoteDialog(props: CreateNoteDialogProps) {
  const sessionQuery = useAuthSessionQuery()

  const user = sessionQuery.data

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false) // always fullscreen under lg

  return (
    <Dialog>
      <DialogTrigger asChild={!!props.triggerComponent}>
        {props.triggerComponent || "New"}
      </DialogTrigger>
      <DialogContent
        disableBackgroundBlur
        showCloseButton={false}
        className={clsx(
          "flex flex-col transition-none",
          "h-screen min-w-full rounded-none", // mobile + fullscreen desktop

          // We only override the base classes when the user is NOT fullscreen.
          !isFullscreen &&
            "lg:h-auto lg:max-h-[70vh] lg:min-h-80 lg:min-w-xl lg:rounded-lg"
        )}
      >
        <CreateNoteDialogInnerContent
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          user={user}
        />
      </DialogContent>
    </Dialog>
  )
}

interface InnerProps {
  user?: GetAuthSessionResponseModel
  isFullscreen: boolean
  setIsFullscreen: Dispatch<SetStateAction<boolean>>
}

function CreateNoteDialogInnerContent(props: InnerProps) {
  const [isEditorEmpty, setIsEditorEmpty] = useState<boolean>(true)
  const [activeFormats, setActiveFormats] = useState<string[]>([]) // for editor marks, e.g. bold/italic/strikethrough
  const [isBulletActive, setIsBulletActive] = useState<boolean>(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder: getRandomPlaceholder(),
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:float-left before:text-gray-400 before:h-0 before:pointer-events-none",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "focus:outline-none h-full max-w-full prose prose-sm dark:prose-invert prose-p:mt-0.5 prose-p:mb-0.5",
      },
    },
    onTransaction: ({ editor }) => {
      setIsEditorEmpty(editor.isEmpty)
      setIsBulletActive(editor.isActive("bulletList"))

      const newFormats: string[] = []
      if (editor.isActive("bold")) newFormats.push("bold")
      if (editor.isActive("italic")) newFormats.push("italic")
      if (editor.isActive("strike")) newFormats.push("strikethrough")

      setActiveFormats((prevFormats) => {
        const isSame =
          prevFormats.length === newFormats.length &&
          prevFormats.every((val, index) => val === newFormats[index])

        return isSame ? prevFormats : newFormats
      })
    },
  })

  const canSubmit = !isEditorEmpty
  const handleSubmit = () => {
    console.log(editor.getJSON().content)
  }

  return (
    <>
      <div className="flex flex-1 flex-row gap-4 overflow-hidden">
        <UserAvatar />
        <div className="flex w-full flex-1 flex-col overflow-hidden">
          <div className="flex w-full justify-between">
            <span className="text-lg text-primary">
              {props.user?.username || "You"}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className={clsx("transition-opacity duration-500", {
                "opacity-0": !isEditorEmpty,
              })}
            >
              Writing a review?
            </Button>
          </div>
          <EditorContent
            editor={editor}
            className="no-scrollbar flex-1 overflow-y-auto"
          />
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          className="hidden lg:flex"
          onClick={() => {
            props.setIsFullscreen(!props.isFullscreen)
          }}
        >
          {props.isFullscreen ? <Minimize2 /> : <Maximize2 />}
        </Button>
      </div>
      <DialogFooter>
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon-lg">
                      <Image />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Media</p>
                  </TooltipContent>
                </Tooltip>
                <ToggleGroup
                  variant={"outline"}
                  type="multiple"
                  value={activeFormats}
                  className="gap-0"
                  size={"lg"}
                >
                  <ToggleGroupItem
                    value="bold"
                    className="rounded-r-none"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                  >
                    <Bold />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="italic"
                    className="rounded-none"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    <Italic />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="strikethrough"
                    className="rounded-l-none"
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                  >
                    <Strikethrough />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Toggle
                  variant={"outline"}
                  pressed={isBulletActive}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  size="lg"
                >
                  <List />
                </Toggle>
              </div>
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="secondary" size={"lg"}>
                  Cancel
                </Button>
              </DialogClose>
              <Button size="lg" disabled={!canSubmit} onClick={handleSubmit}>
                Post
              </Button>
            </div>
          </div>
        </div>
      </DialogFooter>
    </>
  )
}
