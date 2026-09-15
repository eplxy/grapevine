package responses

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error string `json:"error"`
	Code  string `json:"code,omitempty"`
}

func WriteError(c *gin.Context, statusCode int, code, message string) {
	c.JSON(statusCode, ErrorResponse{
		Error: message,
		Code:  code,
	})
}

func WriteBadRequest(c *gin.Context, code, message string) {
	WriteError(c, http.StatusBadRequest, code, message)
}

func WriteUnauthorized(c *gin.Context, code, message string) {
	WriteError(c, http.StatusUnauthorized, code, message)
}

func WriteInternalError(c *gin.Context, code, message string) {
	WriteError(c, http.StatusInternalServerError, code, message)
}
