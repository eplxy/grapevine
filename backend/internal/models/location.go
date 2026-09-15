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

type AutocompleteSuggestion struct {
	PlaceID string   `json:"place_id" binding:"required"`
	Name    string   `json:"name" binding:"required"`    // primary text from places api response
	Address string   `json:"address" binding:"required"` // secondary text from places api response
	Types   []string `json:"types"`
	Matches []struct {
		StartOffset int `json:"start_offset"`
		EndOffset   int `json:"end_offset"`
	} `json:"matches"`
}
