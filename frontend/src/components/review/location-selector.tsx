import { useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import { useLocationAutocomplete } from "@/hooks/queries/location-queries"
import { useDebounce } from "@/hooks/use-debounce"

export type LocationSelectorProps = {}

export default function LocationSelector(props: LocationSelectorProps) {
  const [input, setInput] = useState<string>("")
  const [query, setQuery] = useState<string>("")

  const autocompleteQuery = useLocationAutocomplete(input)


  const debouncedSetQuery = useDebounce(setQuery)

  return (
    <div>
      <Command>
        <CommandInput
          placeholder="Search for a restaurant, cafe, bar..."
          value={input}
          onValueChange={setInput}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {autocompleteQuery.data?.map((suggestion) => {


              return (
                <CommandItem value={suggestion.name} key={suggestion.place_id}>
                  {suggestion.name}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
