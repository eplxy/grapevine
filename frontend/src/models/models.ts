import type { JSONContent } from "@tiptap/react"

export interface FeedItemModel {
  post_id: number
  post_type: PostType
  content?: JSONContent
  text_content?: string
  created_at: string
  author_id: string
  author_name: string
  rating?: number
  location_id?: number
  location_name?: string
  location_address?: string

  media?: MediaItem[]
}

export interface MediaItem {
  url: string
  media_type: string
  display_order: number
}

export const PostType = {
  Note: "note",
  Review: "review",
} as const

export type PostType = (typeof PostType)[keyof typeof PostType]

export interface LocationAutocompleteSuggestion {
  place_id: string
  name: string
  address: string
  lat?: number
  lng?: number
  types?: string[]
  matches?: {
    start_offset: number
    end_offset: number
  }[]
}
