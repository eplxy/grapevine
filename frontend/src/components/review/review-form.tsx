import { useUploadReviewMutation } from "@/hooks/queries/post-queries"
import { EDITOR_CLASSES } from "@/styles/styles"
import { useReviewStore } from "@/stores/review-store"
import { Placeholder } from "@tiptap/extensions"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Italic, List, Strikethrough } from "lucide-react"
import { useState } from "react"
import EditorBubbleMenu from "../editor/bubble-menu"
import MediaUploader, { type MediaUploaderListItem } from "../media-uploader"
import { Button } from "../ui/button"
import { Toggle } from "../ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import StarRating from "./star-rating"

const REVIEW_PLACEHOLDER =
  "What did you like, and what should other people know?"

export default function ReviewForm() {
  const selectedLocation = useReviewStore((state) => state.selectedLocation)
  const resetReview = useReviewStore((state) => state.reset)
  const [rating, setRating] = useState(0)
  const [itemList, setItemList] = useState<MediaUploaderListItem[]>([])
  const [isEditorEmpty, setIsEditorEmpty] = useState(true)
  const [activeFormats, setActiveFormats] = useState<string[]>([])
  const [isBulletActive, setIsBulletActive] = useState(false)
  const reviewMutation = useUploadReviewMutation()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, dropcursor: false }),
      Placeholder.configure({
        placeholder: REVIEW_PLACEHOLDER,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:float-left before:text-gray-400 before:h-0 before:pointer-events-none",
      }),
    ],
    editorProps: {
      attributes: {
        class: `min-h-32 min-w-full focus:outline-none ${EDITOR_CLASSES}`,
      },
    },
    onTransaction: ({ editor: currentEditor }) => {
      setIsEditorEmpty((previous) =>
        previous === currentEditor.isEmpty ? previous : currentEditor.isEmpty
      )
      setIsBulletActive((previous) => {
        const next = currentEditor.isActive("bulletList")
        return previous === next ? previous : next
      })

      const formats: string[] = []
      if (currentEditor.isActive("bold")) formats.push("bold")
      if (currentEditor.isActive("italic")) formats.push("italic")
      if (currentEditor.isActive("strike")) formats.push("strikethrough")
      setActiveFormats((previous) => {
        const isSame =
          previous.length === formats.length &&
          previous.every((format, index) => format === formats[index])
        return isSame ? previous : formats
      })
    },
    autofocus: false,
  })

  const hasMedia = itemList.length > 0
  const mediaReady = itemList.every((item) => !!item.publicURL)
  const canSubmit =
    !!selectedLocation &&
    rating > 0 &&
    (!isEditorEmpty || hasMedia) &&
    mediaReady &&
    !reviewMutation.isPending

  const handleSubmit = () => {
    if (!editor || !selectedLocation || !canSubmit) return

    reviewMutation.mutate(
      {
        location: selectedLocation,
        rating,
        content: editor.getJSON(),
        text_content: editor.getText(),
        media_urls: itemList.map((item) => item.publicURL as string),
      },
      {
        onSuccess: () => {
          editor.commands.clearContent()
          setRating(0)
          setItemList([])
          resetReview()
        },
      }
    )
  }

  const handleCancel = () => {
    editor?.commands.clearContent()
    setRating(0)
    setItemList([])
    resetReview()
  }

  return (
    <div className="flex flex-col gap-4">
      <StarRating
        rating={rating}
        onRatingChange={setRating}
        disabled={!selectedLocation}
      />

      <div className="rounded-xl border border-border p-3">
        <EditorContent editor={editor} />
        {editor && (
          <EditorBubbleMenu
            editor={editor}
            activeFormats={activeFormats}
            isBulletActive={isBulletActive}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ToggleGroup
            variant="outline"
            type="multiple"
            value={activeFormats}
            className="gap-0"
            size="sm"
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
            variant="outline"
            pressed={isBulletActive}
            onPressedChange={() =>
              editor?.chain().focus().toggleBulletList().run()
            }
            size="sm"
          >
            <List />
          </Toggle>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={!isEditorEmpty || rating > 0 || hasMedia}
          >
            Clear
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {reviewMutation.isPending ? "Posting..." : "Post review"}
          </Button>
        </div>
      </div>

      <MediaUploader itemList={itemList} setItemList={setItemList} />
    </div>
  )
}
