import { type Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { Bold, Italic, List, Strikethrough } from "lucide-react"
import { Toggle } from "../ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

interface EditorBubbleMenuProps {
  editor: Editor
  isBulletActive?: boolean
  activeFormats?: string[]
}

export default function EditorBubbleMenu({
  editor,
  isBulletActive,
  activeFormats,
}: EditorBubbleMenuProps) {
  if (!editor) return null

  return (
    <BubbleMenu
      className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md"
      editor={editor}
    >
      <div className="flex items-center gap-2">
        <ToggleGroup
          variant={"outline"}
          type="multiple"
          value={activeFormats}
          className="gap-0"
          size={"sm"}
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
          size="sm"
        >
          <List />
        </Toggle>
      </div>
    </BubbleMenu>
  )
}
