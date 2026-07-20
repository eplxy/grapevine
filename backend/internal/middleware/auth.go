package middleware

import (
	"fmt"
	"grapevine/internal/responses"
	"grapevine/internal/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		fmt.Println("authHeader", authHeader)
		if authHeader == "" {
			responses.WriteUnauthorized(c, "missing_authorization_header", "Authorization header is required")
			c.Abort() // stop downstream handlers from execution
			return
		}

		// expected format: "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			responses.WriteUnauthorized(c, "invalid_authorization_header", "Authorization header format must be Bearer {token}")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			responses.WriteUnauthorized(c, "invalid_token", "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}
