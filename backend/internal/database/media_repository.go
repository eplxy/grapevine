package database

import (
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
}

func NewMediaRepository(client *storage.Client, bucket string) *MediaRepository {
	return &MediaRepository{
		client: client,
		bucket: bucket,
	}
}

// GenerateUploadURL returns the Signed URL for uploading, and the Future Public URL
func (r *MediaRepository) GenerateUploadURL(fileName string, contentType string) (string, string, error) {
	objectName := fmt.Sprintf("tmp/%d-%s", time.Now().Unix(), fileName)

	opts := &storage.SignedURLOptions{
		Scheme:      storage.SigningSchemeV4,
		Method:      "PUT",
		ContentType: contentType,
		Expires:     time.Now().Add(15 * time.Minute),
	}

	signedURL, err := r.client.Bucket(r.bucket).SignedURL(objectName, opts)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	publicURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", r.bucket, objectName)

	return signedURL, publicURL, nil

}
