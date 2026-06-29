package router

import (
	"grapevine/internal/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRouter(authHandler *handlers.AuthHandler) *gin.Engine {
	router := gin.Default()
	router.Use(cors.Default())

	authGroup := router.Group("/auth")

	authGroup.POST("/login", authHandler.LoginHandler)
	authGroup.POST("/register", authHandler.RegisterHandler)
	authGroup.POST("/refresh", authHandler.RefreshHandler)

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/ping", pingHandler)
	return router
}

// pingHandler handles ping requests
// @Summary      Ping endpoint
// @Description  Returns pong message
// @Tags         health
// @Accept       json
// @Produce      json
// @Success      200  {object}  PingResponse
// @Router       /ping [get]
func pingHandler(c *gin.Context) {
	c.JSON(200, PingResponse{
		Message: "pong",
	})
}

// PingResponse represents the ping response
type PingResponse struct {
	Message string `json:"message" example:"pong"`
}
