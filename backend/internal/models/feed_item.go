package models

import "time"

// FeedItem represents a single post (either a note or a review) in the home feed.
type FeedItem struct {
	PostID    int       `json:"post_id"`
	PostType  string    `json:"post_type"` // "note" or "review"
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`

	AuthorID   int    `json:"author_id"`
	AuthorName string `json:"author_name"`

	Rating       *int    `json:"rating,omitempty"`
	LocationID   *int    `json:"location_id,omitempty"`
	LocationName *string `json:"location_name,omitempty"`

	Media []MediaItem `json:"media"`
}

type MediaItem struct {
	URL       string `json:"url"`
	MediaType string `json:"media_type"` // "image" or "video"
}
