package database

import (
	"context"
	"fmt"
	"grapevine/internal/models"

	_ "embed"

	places "cloud.google.com/go/maps/places/apiv1"
	"cloud.google.com/go/maps/places/apiv1/placespb"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc/metadata"
)

//go:embed queries/locations/upsert_location.sql
var upsertLocationsSQL string

type LocationRepository struct {
	db           *pgxpool.Pool
	placesClient *places.Client
}

type LocationDomain interface {
	UpsertLocation(ctx context.Context, googlePlaceID, name, address, locationType string, lat, lng float64) (int, error)
	GetLocationByID(ctx context.Context, id int) (*models.Location, error)
}

func NewLocationRepository(db *pgxpool.Pool, placesClient *places.Client) *LocationRepository {
	return &LocationRepository{
		db:           db,
		placesClient: placesClient,
	}
}

// Upsert checks if google_place_id exists. If yes, returns internal ID. If no, inserts and returns ID.
func (r *LocationRepository) UpsertLocation(ctx context.Context, googlePlaceId, name, address, locationType string, lat, lng float64) (int, error) {

	if lat == 0 && lng == 0 {
		if r.placesClient == nil {
			return 0, fmt.Errorf("places client is not configured")
		}

		fmt.Printf("placeid:%s\n", googlePlaceId)
		ctx = metadata.AppendToOutgoingContext(
			ctx,
			"x-goog-fieldmask",
			"location",
		)
		place, err := r.placesClient.GetPlace(
			ctx,
			&placespb.GetPlaceRequest{
				Name: fmt.Sprintf("places/%s", googlePlaceId), // must be "places/{place_id}"
			},
		)

		if err != nil {
			return 0, fmt.Errorf("failed to get place: %w", err)
		}
		if place.GetLocation() == nil {
			return 0, fmt.Errorf("place %q has no location", googlePlaceId)
		}
		lat = place.GetLocation().GetLatitude()
		lng = place.GetLocation().GetLongitude()
	}

	var locationID int
	err := r.db.QueryRow(ctx, upsertLocationsSQL, googlePlaceId, name, address, locationType, lat, lng).Scan(&locationID)

	if err != nil {
		return 0, fmt.Errorf("failed to upset location: %w", err)
	}

	return locationID, nil

}

func (r *LocationRepository) GetLocationByID(ctx context.Context, id int) (*models.Location, error) {
	var location models.Location

	query := `
		SELECT id, google_place_id, name, address, type, lat, lng
		FROM locations
		WHERE id = $1
	`

	err := r.db.QueryRow(ctx, query, id).Scan(
		&location.ID,
		&location.GooglePlaceID,
		&location.Name,
		&location.Address,
		&location.Type,
		&location.Lat,
		&location.Lng,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("location not found")
		}
		return nil, fmt.Errorf("failed to get location by id: %w", err)
	}

	return &location, nil

}
