package main

import (
	"context"
	"fmt"
	_ "grapevine/docs"
	"grapevine/internal/database"
	"grapevine/internal/handlers"
	"grapevine/internal/router"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
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

	dbpool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create connection pool: %v\n", err)
		os.Exit(1)
	}
	defer dbpool.Close()

	userRepo := database.NewUserRepository(dbpool)

	authHandler := handlers.NewAuthHandler(userRepo, os.Getenv("APP_ENV") == "prod")

	engine := router.SetupRouter(authHandler)
	engine.Run()
}
