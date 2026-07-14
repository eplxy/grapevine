package models

import "time"

type PostType string

const (
	PostTypeNote   PostType = "note"
	PostTypeReview PostType = "review"
)

type Post struct {
	ID        int
	CreatedAt time.Time
	UserID    int
	Type      PostType
	Content   string
}
