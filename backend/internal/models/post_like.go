package models

import "time"

type PostLike struct {
	ID        int       `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	PostID    int       `json:"post_id"`
	UserID    int       `json:"user_id"`
}
