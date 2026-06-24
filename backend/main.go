package main

import (
	"grapevine/internal/router"
	"log"

	"github.com/joho/godotenv"
)

// @title           grapevine API
// @version         1.0
// @description     API for grapevine application

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	router := router.SetupRouter()
	router.Run() // listens on 0.0.0.0:8080 by default
}
