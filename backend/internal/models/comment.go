package models

import "time"

type Comment struct {
	ID         int       `json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	PostID     int       `json:"post_id"`
	UserID     int       `json:"user_id"`
	AuthorName string    `json:"author_name"`
	Content    string    `json:"content"`
	ParentID   int       `json:"parent_id"`
}
