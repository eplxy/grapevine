package database

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/storage"
)

type MediaRepository struct {
	client *storage.Client
	bucket string
}

type MediaDomain interface {
	GenerateUploadURL(fileName string, contentType string) (string, string, error)
	MoveMediaFromTmpToPosts(ctx context.Context, fileName string) error
}

func NewMediaRepository(client *storage.Client, bucket string) *MediaRepository {
	return &MediaRepository{
		client: client,
		bucket: bucket,
	}
}

// GenerateUploadURL returns the Signed URL for uploading, and the Future Public URL
func (r *MediaRepository) GenerateUploadURL(fileName string, contentType string) (string, string, error) {
	prefixlessObjectName := fmt.Sprintf("%d-%s", time.Now().Unix(), fileName)

	opts := &storage.SignedURLOptions{
		Scheme:      storage.SigningSchemeV4,
		Method:      "PUT",
		ContentType: contentType,
		Expires:     time.Now().Add(15 * time.Minute),
	}

	signedURL, err := r.client.Bucket(r.bucket).SignedURL(fmt.Sprintf("tmp/%s", prefixlessObjectName), opts)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	publicURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", r.bucket, fmt.Sprintf("post/%s", prefixlessObjectName))

	return signedURL, publicURL, nil

}

// assume already in temp
func (r *MediaRepository) MoveMediaFromTmpToPosts(ctx context.Context, fileName string) error {

	destinationObjectName := fmt.Sprintf("post/%s", fileName)

	if _, err := r.client.Bucket(r.bucket).Object(fmt.Sprintf("tmp/%s", fileName)).Move(ctx, storage.MoveObjectDestination{Object: destinationObjectName}); err != nil {
		return err
	}
	return nil

}
