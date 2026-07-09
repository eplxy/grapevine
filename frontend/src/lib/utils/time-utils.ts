export const TimeUnit = {
  ms: "ms",
  s: "s",
  m: "m",
  h: "h",
  d: "d",
  w: "w",
} as const

const MS_MAP: Record<TimeUnit, number> = {
  ms: 1,
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
}

export type TimeUnit = (typeof TimeUnit)[keyof typeof TimeUnit]

export function toMilliseconds(value: number, unit: TimeUnit): number {
  return value * MS_MAP[unit]
}
