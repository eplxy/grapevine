export const getErrorMessage = (err: unknown) => {
  const fallbackMessage = err instanceof Error ? err.message : String(err)

  try {
    const parsed = JSON.parse(fallbackMessage) as { error?: unknown }

    if (typeof parsed.error === "string" && parsed.error) {
      return parsed.error
    }
  } catch {
    // Keep the original message when it is not JSON.
  }

  return fallbackMessage
}
