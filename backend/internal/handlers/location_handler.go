package handlers

import (
	"fmt"
	"grapevine/internal/constants"
	"grapevine/internal/database"
	"grapevine/internal/models"
	"grapevine/internal/responses"
	"net/http"

	places "cloud.google.com/go/maps/places/apiv1"
	"cloud.google.com/go/maps/places/apiv1/placespb"
	"github.com/gin-gonic/gin"
	"google.golang.org/genproto/googleapis/geo/type/viewport"
	"google.golang.org/genproto/googleapis/type/latlng"
	"google.golang.org/grpc/metadata"
)

type LocationHandler struct {
	LocationRepo database.LocationDomain
	PlacesClient *places.Client
}

type LocationAutocompleteRequest struct {
	Query        string                                `json:"query" binding:"required"`
	LocationBias *AutocompleteLocationBiasRectangleDTO `json:"location_bias,omitempty"`
}

type LocationAutocompleteResponse struct {
	Suggestions []models.AutocompleteSuggestion `json:"suggestions"`
}

type LocationDetailsRequest struct {
	PlaceID string `json:"place_id" binding:"required"`
}

type LocationDetailsResponse struct {
	PlaceID string   `json:"place_id"`
	Name    string   `json:"name"`
	Address string   `json:"address"`
	Types   []string `json:"types"`
	Lat     float64  `json:"lat"`
	Lng     float64  `json:"lng"`
}

type AutocompleteLocationBiasRectangleDTO struct {
	South float64 `json:"south"`
	West  float64 `json:"west"`
	North float64 `json:"north"`
	East  float64 `json:"east"`
}

func NewLocationHandler(locationRepo database.LocationDomain, placesClient *places.Client) *LocationHandler {
	return &LocationHandler{
		LocationRepo: locationRepo,
		PlacesClient: placesClient,
	}
}

// LocationAutocompleteHandler gets place predictions from the Google Places API
//
// @Summary      Autocomplete places
// @Description  Get place predictions based on a text string. Defaults to a circular bias around Montreal.
// @Tags         location
// @Accept       json
// @Produce      json
// @Param        request body LocationAutocompleteRequest true "Autocomplete query and optional rectangular location bias"
// @Success      200  {object}  LocationAutocompleteResponse "Google Places Autocomplete response"
// @Failure      400  {object}  object "Bad Request - Invalid JSON or missing required fields"
// @Failure      500  {object}  object "Internal Server Error - Google Places API failure"
// @Router		 /location/autocomplete [post]
func (h *LocationHandler) LocationAutocompleteHandler(c *gin.Context) {

	var req LocationAutocompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.WriteBadRequest(c, "invalid_request", err.Error())
		return
	}

	bias := constants.DEFAULT_AUTOCOMPLETE_AUTOCOMPLETE_BIAS

	if req.LocationBias != nil {
		bias = &placespb.AutocompletePlacesRequest_LocationBias{
			Type: &placespb.AutocompletePlacesRequest_LocationBias_Rectangle{
				Rectangle: &viewport.Viewport{
					Low: &latlng.LatLng{
						Latitude:  req.LocationBias.South,
						Longitude: req.LocationBias.West,
					},
					High: &latlng.LatLng{
						Latitude:  req.LocationBias.North,
						Longitude: req.LocationBias.East,
					},
				},
			},
		}
	}

	placesReq := &placespb.AutocompletePlacesRequest{
		Input:                req.Query,
		LocationBias:         bias,
		IncludedPrimaryTypes: constants.SEARCHABLE_LOCATION_PRIMARY_TYPES,
	}

	autocompleteResp, err := h.PlacesClient.AutocompletePlaces(c.Request.Context(), placesReq)

	if err != nil {
		responses.WriteInternalError(c, "places_api_error", err.Error())
		return
	}

	resp, err := mapPlacesResponseToAPI(autocompleteResp)

	if err != nil {
		responses.WriteInternalError(c, "mapping_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, resp)

}

// LocationDetailsHandler gets the coordinates and display data for a selected place.
//
// @Summary      Get place details
// @Description  Get coordinates and display data for a Google Place ID.
// @Tags         location
// @Accept       json
// @Produce      json
// @Param        request body LocationDetailsRequest true "Google Place ID"
// @Success      200  {object} LocationDetailsResponse
// @Failure      400  {object} object "Bad Request - Invalid JSON or missing required fields"
// @Failure      500  {object} object "Internal Server Error - Google Places API failure"
// @Router		 /location/details [post]
func (h *LocationHandler) LocationDetailsHandler(c *gin.Context) {
	var req LocationDetailsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.WriteBadRequest(c, "invalid_request", err.Error())
		return
	}

	ctx := metadata.AppendToOutgoingContext(
		c.Request.Context(),
		"x-goog-fieldmask",
		"id,displayName,formattedAddress,types,location",
	)
	place, err := h.PlacesClient.GetPlace(ctx, &placespb.GetPlaceRequest{
		Name: fmt.Sprintf("places/%s", req.PlaceID),
	})
	if err != nil {
		responses.WriteInternalError(c, "places_api_error", err.Error())
		return
	}
	if place.GetLocation() == nil {
		responses.WriteInternalError(c, "missing_coordinates", "place has no coordinates")
		return
	}

	c.JSON(http.StatusOK, LocationDetailsResponse{
		PlaceID: place.GetId(),
		Name:    place.GetDisplayName().GetText(),
		Address: place.GetFormattedAddress(),
		Types:   place.GetTypes(),
		Lat:     place.GetLocation().GetLatitude(),
		Lng:     place.GetLocation().GetLongitude(),
	})
}

func mapPlacesResponseToAPI(placesRes *placespb.AutocompletePlacesResponse) (LocationAutocompleteResponse, error) {

	finalSuggestions := []models.AutocompleteSuggestion{}
	if placesRes == nil {
		return LocationAutocompleteResponse{Suggestions: finalSuggestions}, nil
	}

	for _, suggestion := range placesRes.Suggestions {
		prediction := suggestion.GetPlacePrediction()
		if prediction == nil {
			continue
		}

		var matches []struct {
			StartOffset int `json:"start_offset"`
			EndOffset   int `json:"end_offset"`
		}

		for _, match := range prediction.GetText().GetMatches() {
			matches = append(matches, struct {
				StartOffset int `json:"start_offset"`
				EndOffset   int `json:"end_offset"`
			}{
				StartOffset: int(match.GetStartOffset()),
				EndOffset:   int(match.GetEndOffset()),
			})
		}

		structuredFormat := prediction.GetStructuredFormat()

		finalSuggestions = append(finalSuggestions, models.AutocompleteSuggestion{
			PlaceID: prediction.GetPlaceId(),
			Name:    structuredFormat.GetMainText().GetText(),
			Address: structuredFormat.GetSecondaryText().GetText(),
			Types:   prediction.GetTypes(),
			Matches: matches,
		})
	}

	return LocationAutocompleteResponse{
		Suggestions: finalSuggestions,
	}, nil
}
