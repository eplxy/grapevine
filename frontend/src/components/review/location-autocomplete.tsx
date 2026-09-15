import { useLocationAutocomplete } from "@/hooks/queries/location-queries"
import { useDebounce } from "@/hooks/use-debounce"
import type { LocationAutocompleteSuggestion } from "@/models/models"
import clsx from "clsx"
import { Command as CommandPrimitive } from "cmdk"
import { useRef, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command"
import { Spinner } from "../ui/spinner"
import LocationTypeIcon from "./location-type-icon"

export default function LocationAutocomplete({
  location,
  setLocation,
}: {
  location: LocationAutocompleteSuggestion | undefined
  setLocation: (location: LocationAutocompleteSuggestion | undefined) => void
}) {
  const [input, setInput] = useState<string>("")
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const debouncedInput = useDebounce(input)
  const inputRef = useRef<HTMLInputElement>(null)

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
    setIsInputFocused(false)
    setInput((prev: string) => suggestion?.name || prev)
    console.log(placeID, suggestion)
  }

  const handleInputClicked = () => {
    setIsInputFocused(true)
    inputRef.current?.focus()
  }

  return (
    <div>
      <Command onValueChange={handleLocationSelected} shouldFilter={false}>
        <div
          className="flex items-center rounded-xl border border-border bg-accent p-2"
          onClick={handleInputClicked}
        >
          {!!location && !isInputFocused && (
            <div className="flex flex-row gap-4">
              <div className="flex h-12 min-w-12 items-center justify-center rounded-md border border-border bg-card p-0 sm:h-16 sm:min-w-16">
                <LocationTypeIcon types={location?.types} />
              </div>
              <div className="flex flex-col">
                <span className="text-base">{location?.name}</span>
                <span className="text-sm text-muted-foreground">
                  {location?.address}
                </span>
              </div>
            </div>
          )}
          <CommandPrimitive.Input
            ref={inputRef}
            value={input}
            onValueChange={(value) => {
              setInput(value)
              setIsInputFocused(true)
            }}
            placeholder="Search for a restaurant, cafe, bar..."
            className={clsx("ml-2 w-full bg-transparent outline-none", {
              "w-0! opacity-0": !!location && !isInputFocused,
            })}
            onBlur={() => {
              setIsInputFocused(false)
              if (!input) {
                setLocation(undefined)
              }
            }}
          ></CommandPrimitive.Input>
        </div>
        {!!input && isInputFocused && (
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
                  key={suggestion.place_id}
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
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {renderContent()}
    </CommandItem>
  )
}
