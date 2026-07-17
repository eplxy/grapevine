package models

import "time"

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
	ID         int
	CreatedAt  time.Time
	UserID     int
	Type       PostType
	Content    string
	Visibility PostVisibility
}
