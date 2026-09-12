import { useUploadMediaToStorageQuery } from "@/hooks/queries/media-queries"
import { stripImageMetadata } from "@/lib/utils/media-utils"
import { Image, XCircle } from "lucide-react"
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ChangeEventHandler,
  type Dispatch,
  type SetStateAction,
} from "react"
import { toast } from "react-toastify"
import { Button } from "./ui/button"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { Spinner } from "./ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type MediaUploaderProps = {
  itemList: MediaUploaderListItem[]
  setItemList: Dispatch<SetStateAction<MediaUploaderListItem[]>>
}

export interface MediaUploaderListItem {
  id: string
  file: File
  publicURL?: string

}

// TODO refactor for editing
export default function MediaUploader(props: MediaUploaderProps) {
  const { itemList, setItemList } = props
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleFileInputted = async (ev: ChangeEvent<HTMLInputElement>) => {
    if (!ev.target.files || ev.target.files?.length == 0) return
    const filesToAdd = Array.from(ev.target.files)
    if (filesToAdd.length + itemList.length > 10) {
      toast.error("A maximum of 10 files can be added to a post.")
      return
    }

    try {
      const cleanFiles = await Promise.all(
        filesToAdd.map((file) => stripImageMetadata(file))
      )

      const newItems: MediaUploaderListItem[] = cleanFiles.map((f) => ({
        id: `${f.name}-${f.lastModified}-${Math.random().toString(36).substring(7)}`,
        file: f,
      }))

      setItemList((prev) => [...prev, ...newItems])
    } catch (error) {
      console.error("Failed to strip metadata:", error)
      toast.error("Failed to process images.")
    } finally {
      ev.target.value = ""
    }
  }

  const handleSingleUploadCompleted = (publicURL: string, id: string) => {
    setItemList((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, publicURL } : item
      )
    )
  }

  const handleRemove = (idToRemove: string) => {
    setItemList((prev) => prev.filter((item) => item.id !== idToRemove))
  }
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItemList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex w-full items-end gap-2">
      <MediaInput onInput={handleFileInputted} />
      <ScrollArea className="w-max overflow-hidden">
        <div className="flex max-h-24 w-max gap-2 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemList.map((item) => item.id)}
              strategy={horizontalListSortingStrategy}
            >
              {itemList.map((item) => (
                <SortableMediaPreview
                  key={item.id}
                  id={item.id}
                  file={item.file}
                  onUploadComplete={(publicURL: string) => handleSingleUploadCompleted(publicURL, item.id )}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

function SortableMediaPreview(props: {
  id: string
  file: File
  onUploadComplete: (url: string) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab touch-pan-x active:cursor-grabbing"
    >
      <MediaPreview
        file={props.file}
        onUploadComplete={props.onUploadComplete}
        onRemove={props.onRemove}
      />
    </div>
  )
}

function MediaPreview({
  file,
  onUploadComplete,
  onRemove,
}: {
  file: File
  onUploadComplete?: (publicURL: string) => void
  onRemove?: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const hasFiredCallbacks = useRef<boolean>(false)

  const {
    data: publicURL,
    isSuccess,
    isError,
    isLoading,
    error,
  } = useUploadMediaToStorageQuery(file)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    if (imgRef.current) imgRef.current.src = objectUrl // mutate dom directly to bypass cascading render w/ useState
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  useEffect(() => {
    if (isSuccess && publicURL && !hasFiredCallbacks.current) {
      hasFiredCallbacks.current = true
      if (onUploadComplete) {
        onUploadComplete(publicURL)
      }
    }

    if (isError && !hasFiredCallbacks.current) {
      hasFiredCallbacks.current = true
      toast.error(error?.message || "Upload failed")
    }
  }, [isSuccess, isError, publicURL, error, onUploadComplete])

  return (
    <div className="relative h-24 w-24 shrink-0 hover:[&>svg]:opacity-100">
      <img
        ref={imgRef}
        alt="Upload preview"
        className="h-full w-full rounded-2xl border border-gray-200 object-cover dark:border-gray-800"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-xs text-white">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-red-500/70 text-xs text-white">
          Failed
        </div>
      )}

      {onRemove && (
        <Button
          size="icon-xs"
          className="absolute inset-1 flex lg:opacity-0 hover:opacity-100"
          asChild
          onClick={onRemove}
        >
          <XCircle />
        </Button>
      )}
    </div>
  )
}

function MediaInput(props: { onInput: ChangeEventHandler<HTMLInputElement> }) {
  return (
    <>
      <input
        id="media-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={props.onInput}
        multiple
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" size="icon-lg">
            <label htmlFor="media-upload">
              <Image />
            </label>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Media</p>
        </TooltipContent>
      </Tooltip>
    </>
  )
}
