package models

import (
	"encoding/json"
	"time"
)

type PostType string

const (
	PostTypeNote   PostType = "note"
	PostTypeReview PostType = "review"
)

type PostVisibility string

const (
	PostVisibilityPublic    PostVisibility = "public"
	PostVisibilityFollowers PostVisibility = "followers-only"
	PostVisibilityPrivate   PostVisibility = "private"
)

type Post struct {
	ID          int             `json:"id" db:"id"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UserID      int             `json:"user_id" db:"user_id"`
	Type        PostType        `json:"type" db:"type"`
	Content     json.RawMessage `json:"content" db:"content" swaggertype:"object"`
	TextContent string          `json:"text_content" db:"text_content"`

	Visibility PostVisibility `json:"visibility" db:"visibility"`
}
