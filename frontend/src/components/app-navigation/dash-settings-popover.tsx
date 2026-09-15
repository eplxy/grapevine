import { Moon, Sun, SunMoon } from "lucide-react"
import type { JSX } from "react/jsx-runtime"
import AuthButton from "../buttons/auth-button"
import { useTheme } from "../theme-provider"
import { Label } from "../ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

export function DashboardSettingsPopover({
  triggerComponent,
  side,
}: {
  triggerComponent: JSX.Element
  side?: "right" | "top" | "bottom" | "left" | undefined
}) {
  const { theme, setTheme } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerComponent}</PopoverTrigger>
      <PopoverContent side={side} sideOffset={16}>
        <PopoverTitle>Extra options</PopoverTitle>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label>Display theme</Label>
              <ToggleGroup
                type="single"
                defaultValue={theme || "system"}
                onValueChange={setTheme}
              >
                <ToggleGroupItem
                  title="Light"
                  value="light"
                  aria-label="Toggle light"
                >
                  <Sun />
                </ToggleGroupItem>
                <ToggleGroupItem
                  title="Dark"
                  value="dark"
                  aria-label="Toggle dark"
                >
                  <Moon />
                </ToggleGroupItem>
                <ToggleGroupItem
                  title="System Default"
                  value="system"
                  aria-label="Toggle system default"
                >
                  <SunMoon />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <AuthButton />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
