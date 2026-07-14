package handlers

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetUserIDAsInt(c *gin.Context) (int, error) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		return 0, errors.New("user not authenticated")
	}

	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return 0, errors.New("invalid user ID format in token")
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		return 0, errors.New("failed to parse user ID")
	}

	return userID, nil
}
