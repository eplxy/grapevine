package constants

import (
	"errors"

	"cloud.google.com/go/maps/places/apiv1/placespb"
	"google.golang.org/genproto/googleapis/type/latlng"
)

type Environment int

const (
	Development Environment = iota
	Preview
	Production
)

func EnvironmentStringToInt(envVar string) (Environment, error) {
	switch envVar {
	case "development":
		return 0, nil
	case "preview":
		return 1, nil
	case "production":
		return 2, nil
	default:
		return 0, errors.New("invalid environment passed to APP_ENV")
	}
}

// montreal coordinates
var DEFAULT_AUTOCOMPLETE_AUTOCOMPLETE_BIAS = &placespb.AutocompletePlacesRequest_LocationBias{
	Type: &placespb.AutocompletePlacesRequest_LocationBias_Circle{
		Circle: &placespb.Circle{
			Center: &latlng.LatLng{
				Latitude: 45.5019, Longitude: -73.5674,
			},
			Radius: 5000.0,
		},
	},
}
