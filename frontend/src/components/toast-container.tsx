import { ToastContainer, type ToastContainerProps } from "react-toastify"
import { useTheme } from "./theme-provider"

export default function WrappedToastContainer(props: ToastContainerProps) {
  const { theme } = useTheme()

  return <ToastContainer {...props} theme={theme} />
}