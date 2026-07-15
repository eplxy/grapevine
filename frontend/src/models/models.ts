export interface FeedItemModel {
  post_id: number,
  post_type: PostType,
  content?: string,
  created_at: string,
  author_id: string
  author_name: string
  rating?: number
  location_id?: number
  location_name?: string

  media?: MediaItem[]
}

export interface MediaItem {
  url: string
  media_type: string
}

export const PostType = {
  Note: "note",
  Review: "review"
} as const

export type PostType = (typeof PostType)[keyof typeof PostType]
