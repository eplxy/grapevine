export function hasEmoji(value: string) {
  return /\p{Extended_Pictographic}/u.test(value)
}

export function getInitials(value: string) {
  const parts = value.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return "";

  if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    const firstInitial = parts[0][0];
    const lastInitial = parts[parts.length - 1][0];

    return (firstInitial + lastInitial).toUpperCase();
}
