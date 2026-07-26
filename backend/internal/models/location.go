package models

type Location struct {
	ID            int     `json:"id"`
	GooglePlaceID string  `json:"google_place_id"`
	Name          string  `json:"name"`
	Address       string  `json:"address"`
	Type          string  `json:"type"`
	Lat           float64 `json:"lat"`
	Lng           float64 `json:"lng"`
}
