package database

// Media cleanup worker written by Copilot
// Used to clean up media objects that are no longer needed after a post is deleted.

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const mediaCleanupOutboxSchema = `
CREATE TABLE IF NOT EXISTS media_cleanup_outbox (
	id BIGSERIAL PRIMARY KEY,
	media_url TEXT NOT NULL UNIQUE,
	attempts INTEGER NOT NULL DEFAULT 0,
	available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	last_error TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`

type mediaCleanupItem struct {
	id       int64
	mediaURL string
	attempts int
}

// EnsureMediaCleanupOutbox creates the durable cleanup queue before posts can
// be deleted. It is safe to call on every application start.
func EnsureMediaCleanupOutbox(ctx context.Context, db *pgxpool.Pool) error {
	if _, err := db.Exec(ctx, mediaCleanupOutboxSchema); err != nil {
		return fmt.Errorf("failed to initialize media cleanup outbox: %w", err)
	}
	return nil
}

// MediaCleanupWorker retries object deletion independently of the post
// endpoint, so a committed post deletion cannot strand its media.
type MediaCleanupWorker struct {
	db        *pgxpool.Pool
	mediaRepo MediaDomain
}

func NewMediaCleanupWorker(db *pgxpool.Pool, mediaRepo MediaDomain) *MediaCleanupWorker {
	return &MediaCleanupWorker{db: db, mediaRepo: mediaRepo}
}

func (w *MediaCleanupWorker) Run(ctx context.Context) {
	w.process(ctx)
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.process(ctx)
		}
	}
}

func (w *MediaCleanupWorker) process(ctx context.Context) {
	rows, err := w.db.Query(ctx, `
		SELECT id, media_url, attempts
		FROM media_cleanup_outbox
		WHERE available_at <= NOW()
		ORDER BY id
		LIMIT 50
	`)
	if err != nil {
		log.Printf("media cleanup outbox read failed: %v", err)
		return
	}
	defer rows.Close()

	var items []mediaCleanupItem
	for rows.Next() {
		var item mediaCleanupItem
		if err := rows.Scan(&item.id, &item.mediaURL, &item.attempts); err != nil {
			log.Printf("media cleanup outbox scan failed: %v", err)
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		log.Printf("media cleanup outbox read failed: %v", err)
		return
	}

	for _, item := range items {
		if err := w.deleteItem(ctx, item); err != nil {
			log.Printf("media cleanup retry for %q failed: %v", item.mediaURL, err)
		}
	}
}

func (w *MediaCleanupWorker) deleteItem(ctx context.Context, item mediaCleanupItem) error {
	fileName, err := extractMediaObjectName(item.mediaURL)
	if err == nil {
		err = w.mediaRepo.DeleteMedia(ctx, fileName)
	}
	if err == nil {
		if _, deleteErr := w.db.Exec(ctx, `DELETE FROM media_cleanup_outbox WHERE id = $1`, item.id); deleteErr != nil {
			return fmt.Errorf("failed to remove completed cleanup: %w", deleteErr)
		}
		return nil
	}

	attempts := item.attempts + 1
	backoff := min(attempts, 6)
	delayMinutes := 1 << backoff
	_, updateErr := w.db.Exec(ctx, `
		UPDATE media_cleanup_outbox
		SET attempts = $2,
			available_at = NOW() + ($3::double precision * INTERVAL '1 minute'),
			last_error = $4
		WHERE id = $1
	`, item.id, attempts, delayMinutes, err.Error())
	if updateErr != nil {
		return fmt.Errorf("cleanup failed (%v), and retry scheduling failed: %w", err, updateErr)
	}
	return err
}

func extractMediaObjectName(rawURL string) (string, error) {
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("failed to parse media URL: %w", err)
	}
	parts := strings.Split(strings.TrimPrefix(parsedURL.Path, "/"), "/")
	if len(parts) == 0 || parts[len(parts)-1] == "" {
		return "", fmt.Errorf("media URL has no object name: %s", rawURL)
	}
	return parts[len(parts)-1], nil
}
