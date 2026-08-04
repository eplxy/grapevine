import { Coffee, MapPin, Martini, Utensils } from "lucide-react"

export default function LocationTypeIcon({
  types,
}: {
  types: string[] | undefined
}): React.ReactNode {
  if (!types) return <MapPin />
  if (types.includes("cafe")) {
    return <Coffee />
  }

  if (types.includes("bar")) {
    return <Martini />
  }

  if (types.includes("food")) {
    return <Utensils />
  }

  return <MapPin />
}
