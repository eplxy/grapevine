package router

import (
	"grapevine/internal/constants"
	"grapevine/internal/handlers"
	"grapevine/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRouter(env constants.Environment, authHandler *handlers.AuthHandler) *gin.Engine {
	router := gin.Default()
	router.Use(cors.New(getCorsConfig(env)))

	authGroup := router.Group("/auth")

	authGroup.POST("/login", authHandler.LoginHandler)
	authGroup.POST("/register", authHandler.RegisterHandler)
	authGroup.POST("/refresh", authHandler.RefreshHandler)
	authGroup.GET("/me", middleware.AuthMiddleware(), authHandler.MeHandler)

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/ping", pingHandler)
	return router
}

func getCorsConfig(env constants.Environment) cors.Config {
	corsConfig := cors.DefaultConfig()

	if env == constants.Production {
		corsConfig.AllowOrigins = []string{"https://grapevine-xi.vercel.app"}
	} else {
		corsConfig.AllowOrigins = []string{"http://localhost:5173"}
	}

	corsConfig.AllowHeaders = []string{
		"Origin",
		"Content-Length",
		"Content-Type",
		"Authorization",
	}
	corsConfig.AllowCredentials = true
	return corsConfig
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
