package models

import "time"

type Review struct {
	ID         int
	CreatedAt  time.Time
	LocationId int
	Rating     int
}
