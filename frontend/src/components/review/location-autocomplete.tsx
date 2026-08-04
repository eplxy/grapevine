import { useLocationAutocomplete } from "@/hooks/queries/location-queries"
import { useDebounce } from "@/hooks/use-debounce"
import type { LocationAutocompleteSuggestion } from "@/models/models"
import { Command as CommandPrimitive } from "cmdk"
import { useState, type Dispatch, type SetStateAction } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command"
import { Spinner } from "../ui/spinner"
import type { LocationModel } from "./location-selector"
import LocationTypeIcon from "./location-type-icon"

export default function LocationAutocomplete({
  location,
  setLocation,
}: {
  location: LocationModel | undefined
  setLocation: Dispatch<SetStateAction<LocationModel | undefined>>
}) {
  const [input, setInput] = useState<string>("")
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const debouncedInput = useDebounce(input)

  const autocompleteQuery = useLocationAutocomplete(debouncedInput)

  const handleLocationSelected = (placeID: string) => {
    if (placeID == "") setLocation(undefined)

    const suggestion = autocompleteQuery.data?.find(
      (suggestion) => placeID == suggestion.place_id
    )
    setLocation(
      autocompleteQuery.data?.find(
        (suggestion) => placeID == suggestion.place_id
      )
    )
    setIsOpen(false)
    console.log(placeID, suggestion)
  }

  return (
    <div>
      <Command onValueChange={handleLocationSelected} shouldFilter={false}>
        {/*<CommandInput
          placeholder="Search for a restaurant, cafe, bar..."
          value={input}
          onValueChange={setInput}
        />*/}

        <div className="flex items-center rounded-xl border border-border bg-accent p-2">
          {/*<MyCustomIcon />*/}
          {!!location && <LocationTypeIcon types={location?.types} />}
          <CommandPrimitive.Input
            value={input}
            onValueChange={(value) => {
              setInput(value)
              setIsOpen(true)
            }}
            placeholder="Search for a restaurant, cafe, bar..."
            className="ml-2 w-full bg-transparent outline-none"
          />
        </div>
        {isOpen && (
          <CommandList>
            {!!debouncedInput && !autocompleteQuery.isLoading && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {autocompleteQuery.isLoading && (
              <Spinner className="mt-2 flex w-full items-center" />
            )}
            <CommandGroup>
              {autocompleteQuery.data?.map((suggestion) => (
                <AutocompleteItem
                  item={suggestion}
                  handleSelect={handleLocationSelected}
                />
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  )
}

function AutocompleteItem({
  item,
  handleSelect,
}: {
  item: LocationAutocompleteSuggestion
  handleSelect: (placeID: string) => void
}) {
  const renderContent = () => {
    const matches = item.matches
    if (!matches || matches.length === 0) {
      return <span>{item.name}</span>
    }

    const sortedMatches = [...matches].sort(
      (a, b) => a.start_offset - b.start_offset
    )

    const elements: React.ReactNode[] = []
    let currentIndex = 0

    sortedMatches.forEach((match, index) => {
      if (currentIndex < match.start_offset) {
        elements.push(
          <span key={`unmatched-${index}`}>
            {item.name.slice(currentIndex, match.start_offset)}
          </span>
        )
      }

      elements.push(
        <strong key={`matched-${index}`} className="font-bold">
          {item.name.slice(match.start_offset, match.end_offset)}
        </strong>
      )

      currentIndex = match.end_offset
    })

    if (currentIndex < item.name.length) {
      elements.push(
        <span key="unmatched-end">{item.name.slice(currentIndex)}</span>
      )
    }

    return (
      <div className="flex w-full flex-col">
        <span className="text-ellipsis">{elements}</span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
          {item.address}
        </span>
      </div>
    )
  }

  return (
    <CommandItem
      onSelect={handleSelect}
      value={item.place_id}
      key={item.place_id}
    >
      {renderContent()}
    </CommandItem>
  )
}
