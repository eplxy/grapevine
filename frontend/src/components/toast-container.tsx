import { ToastContainer, type ToastContainerProps } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useTheme } from "./theme-provider"

export default function WrappedToastContainer(props: ToastContainerProps) {
  const { theme } = useTheme()
  const toastTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  return <ToastContainer {...props} theme={toastTheme} />
}