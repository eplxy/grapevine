import { Slot } from "@radix-ui/react-slot"
import type { ComponentProps, JSX } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { Dialog } from "../ui/dialog"

type CancelConfirmationAlertDialogProps = {
  title?: string
  triggerComponent: JSX.Element
  bypassAlert?: boolean // if true, the dialog is ignored, and the trigger component runs its own handler
  onConfirm: () => void
} & ComponentProps<typeof Dialog>

export default function CancelConfirmationAlertDialog(
  props: CancelConfirmationAlertDialogProps
) {
  if (props.bypassAlert) {
    return <Slot onClick={props.onConfirm}>{props.triggerComponent}</Slot>
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild={!!props.triggerComponent}>
        {props.triggerComponent || "Cancel"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {props.title || "Confirm cancellation"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={"destructive"} onClick={props.onConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
