package main

import (
	"context"
	"fmt"
	_ "grapevine/docs"
	"grapevine/internal/constants"
	"grapevine/internal/database"
	"grapevine/internal/handlers"
	"grapevine/internal/router"
	"log"
	"os"

	places "cloud.google.com/go/maps/places/apiv1"
	"cloud.google.com/go/storage"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
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

	ctx := context.Background()
	gcsClient, err := storage.NewClient(ctx)
	checkErr(err)

	placesClient, err := places.NewClient(ctx, option.WithAPIKey(os.Getenv("MAPS_API_KEY")))
	checkErr(err)
	defer placesClient.Close()

	userRepo := database.NewUserRepository(dbpool)
	postRepo := database.NewPostRepository(dbpool)
	locationRepo := database.NewLocationRepository(dbpool, placesClient)
	mediaRepo := database.NewMediaRepository(gcsClient, os.Getenv("GCS_BUCKET_NAME"))

	env, err := constants.EnvironmentStringToInt(os.Getenv("APP_ENV"))
	checkErr(err)

	authHandler := handlers.NewAuthHandler(userRepo, env == constants.Production)
	postHandler := handlers.NewPostHandler(postRepo, locationRepo, mediaRepo)
	mediaHandler := handlers.NewMediaHandler(mediaRepo)
	locationHandler := handlers.NewLocationHandler(locationRepo, placesClient)

	engine := router.SetupRouter(env, authHandler, postHandler, mediaHandler, locationHandler)
	engine.Run()
}

func checkErr(err error) {
	if err != nil {
		fmt.Fprintf(os.Stderr, "an error occurred: %v\n", err)
		os.Exit(1)
	}
}
