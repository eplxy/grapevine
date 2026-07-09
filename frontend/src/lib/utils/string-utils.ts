export function hasEmoji(value: string) {
  return /\p{Extended_Pictographic}/u.test(value)
}
