package constants

import "errors"

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
