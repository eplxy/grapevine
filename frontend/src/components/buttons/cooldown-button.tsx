import { useState, type ComponentProps, type MouseEvent } from "react"
import { Button } from "../ui/button"
import { TimeUnit, toMilliseconds } from "@/lib/utils/time-utils"

export type CooldownButtonProps = {
  cooldown: number
  unit?: TimeUnit
} & ComponentProps<typeof Button>

export default function CooldownButton(props: CooldownButtonProps) {
  const {
    cooldown: cooldownProp,
    unit: unitProp,
    disabled,
    onClick,
    ...rest
  } = props

  const unit = unitProp || TimeUnit.ms

  const [onCooldown, setOnCooldown] = useState<boolean>(false)

  const isDisabled = disabled || onCooldown

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!!onClick) onClick(e)
    setOnCooldown(true)
    setTimeout(() => setOnCooldown(false), toMilliseconds(cooldownProp, unit))
  }

  return (
    <Button onClick={handleClick} disabled={isDisabled} {...rest}>
      {props.children}
    </Button>
  )
}
