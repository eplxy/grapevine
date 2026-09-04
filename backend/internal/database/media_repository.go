package database

import (
	"context"
	"errors"
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

// MoveMediaFromTmpToPosts finalizes an upload. It is safe to retry after a
// previous successful move.
func (r *MediaRepository) MoveMediaFromTmpToPosts(ctx context.Context, fileName string) error {

	destinationObjectName := fmt.Sprintf("post/%s", fileName)
	sourceObject := r.client.Bucket(r.bucket).Object(fmt.Sprintf("tmp/%s", fileName))
	destinationObject := r.client.Bucket(r.bucket).Object(destinationObjectName)

	if _, err := sourceObject.Move(ctx, storage.MoveObjectDestination{Object: destinationObjectName}); err == nil {
		return nil
	} else if !errors.Is(err, storage.ErrObjectNotExist) {
		// A destination may already exist after a successful prior attempt.
		if _, destinationErr := destinationObject.Attrs(ctx); destinationErr == nil {
			return nil
		}
		return fmt.Errorf("failed to move media %q: %w", fileName, err)
	}

	if _, err := destinationObject.Attrs(ctx); err != nil {
		return fmt.Errorf("media %q is not available in temporary or post storage: %w", fileName, err)
	}

	return nil
}
