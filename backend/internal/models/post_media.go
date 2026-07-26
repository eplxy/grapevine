package models

import "time"

type PostMedia struct {
	ID           int
	CreatedAt    time.Time
	PostID       int
	URL          string
	Type         string
	DisplayOrder int
}
