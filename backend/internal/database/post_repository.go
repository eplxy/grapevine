package database

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"grapevine/internal/models"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed queries/posts/get_home_feed.sql
var getHomeFeedSQL string

//go:embed queries/posts/get_post_by_id.sql
var getPostByIDSQL string

type PostRepository struct {
	db *pgxpool.Pool
}

type FeedCursor struct {
	CreatedAt time.Time
	PostID    int
}

type FeedPage struct {
	Items   []models.FeedItem
	HasMore bool
}

type PostDomain interface {
	CreateNote(ctx context.Context, userID int, content json.RawMessage, textContent string, mediaURLs []string) (int, error)
	CreateReview(ctx context.Context, userID, locationID int, rating int, content json.RawMessage, text_content string, mediaURLs []string) (int, error)
	DeletePost(ctx context.Context, postID, userID int) ([]string, error)
	GetHomeFeed(ctx context.Context, limit int, cursor *FeedCursor) (FeedPage, error)
	GetPostByID(ctx context.Context, postID int) (*models.FeedItem, error)
}

// DeletePost removes an owned post and its dependent rows in one transaction.
// It returns the finalized media object names for cloud-storage cleanup.
func (r *PostRepository) DeletePost(ctx context.Context, postID, userID int) ([]string, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT pm.url
		FROM posts p
		LEFT JOIN post_media pm ON pm.post_id = p.id
		WHERE p.id = $1 AND p.user_id = $2
	`, postID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to load post media: %w", err)
	}

	var mediaURLs []string
	postFound := false
	for rows.Next() {
		var mediaURL *string
		if err := rows.Scan(&mediaURL); err != nil {
			rows.Close()
			return nil, fmt.Errorf("failed to scan post media: %w", err)
		}
		postFound = true
		if mediaURL != nil {
			mediaURLs = append(mediaURLs, *mediaURL)
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, fmt.Errorf("failed to read post media: %w", err)
	}
	rows.Close()

	if !postFound {
		return nil, fmt.Errorf("post not found")
	}

	if _, err := tx.Exec(ctx, `DELETE FROM post_media WHERE post_id = $1`, postID); err != nil {
		return nil, fmt.Errorf("failed to delete post media: %w", err)
	}
	// DELETE is intentionally unconditional: notes have no matching review row,
	// and PostgreSQL treats that as a successful zero-row delete.
	if _, err := tx.Exec(ctx, `DELETE FROM reviews WHERE id = $1`, postID); err != nil {
		return nil, fmt.Errorf("failed to delete review details: %w", err)
	}
	result, err := tx.Exec(ctx, `DELETE FROM posts WHERE id = $1 AND user_id = $2`, postID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to delete post: %w", err)
	}
	if result.RowsAffected() != 1 {
		return nil, fmt.Errorf("post not found")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit post deletion: %w", err)
	}
	return mediaURLs, nil
}

func NewPostRepository(db *pgxpool.Pool) *PostRepository {
	return &PostRepository{db: db}
}

// CreateNote inserts into posts and post_media
func (r *PostRepository) CreateNote(ctx context.Context, userID int, content json.RawMessage, textContent string, mediaURLs []string) (int, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var postID int
	postQuery := `
			INSERT INTO posts (user_id, type, content, text_content)
			VALUES ($1, $2, $3, $4)
			RETURNING id`
	err = tx.QueryRow(ctx, postQuery, userID, models.PostTypeNote, content, textContent).Scan(&postID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert note: %w", err)
	}

	if len(mediaURLs) > 0 {
		mediaQuery := `INSERT INTO post_media (post_id, url, type, display_order) VALUES ($1, $2, $3, $4)`
		for idx, url := range mediaURLs {

			// TODO alter method signature to accept videos too
			_, err = tx.Exec(ctx, mediaQuery, postID, url, "image", idx+1)
			if err != nil {
				return 0, fmt.Errorf("failed to insert media: %w", err)
			}
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return postID, nil
}

// CreateReview inserts into posts, reviews, and post_media in a single transaction
func (r *PostRepository) CreateReview(ctx context.Context, userID, locationID int, rating int, content json.RawMessage, textContent string, mediaURLs []string) (int, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var postID int
	postQuery := `
		INSERT INTO posts (user_id, type, content, text_content)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	err = tx.QueryRow(ctx, postQuery, userID, models.PostTypeReview, content, textContent).Scan(&postID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert review post: %w", err)
	}

	reviewQuery := `
		INSERT INTO reviews (id, location_id, rating)
		VALUES ($1, $2, $3)`

	_, err = tx.Exec(ctx, reviewQuery, postID, locationID, rating)
	if err != nil {
		return 0, fmt.Errorf("failed to insert review details: %w", err)
	}

	if len(mediaURLs) > 0 {
		mediaQuery := `INSERT INTO post_media (post_id, url, type, display_order) VALUES ($1, $2, $3, $4)`
		for idx, url := range mediaURLs {
			_, err = tx.Exec(ctx, mediaQuery, postID, url, "image", idx)
			if err != nil {
				return 0, fmt.Errorf("failed to insert media: %w", err)
			}
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return postID, nil
}

// GetHomeFeed joins posts, reviews, locations, and post_media into a single struct
func (r *PostRepository) GetHomeFeed(ctx context.Context, limit int, cursor *FeedCursor) (FeedPage, error) {
	var cursorCreatedAt *time.Time
	cursorPostID := 0
	if cursor != nil {
		cursorCreatedAt = &cursor.CreatedAt
		cursorPostID = cursor.PostID
	}

	rows, err := r.db.Query(ctx, getHomeFeedSQL, limit+1, cursorCreatedAt, cursorPostID)
	if err != nil {
		return FeedPage{}, fmt.Errorf("failed to query home feed: %w", err)
	}
	defer rows.Close()

	feed := make([]models.FeedItem, 0, limit+1)

	for rows.Next() {
		var item models.FeedItem
		var mediaJSON []byte // json to byte slice to safely unmarshal first

		err := rows.Scan(
			&item.PostID,
			&item.PostType,
			&item.Content,
			&item.TextContent,
			&item.CreatedAt,
			&item.AuthorID,
			&item.AuthorName,
			&item.Rating,
			&item.LocationID,
			&item.LocationName,
			&item.LocationAddress,
			&mediaJSON,
		)
		if err != nil {
			return FeedPage{}, fmt.Errorf("failed to scan feed row: %w", err)
		}

		if err := json.Unmarshal(mediaJSON, &item.Media); err != nil {
			return FeedPage{}, fmt.Errorf("failed to unmarshal media json: %w", err)
		}

		feed = append(feed, item)
	}

	if err := rows.Err(); err != nil {
		return FeedPage{}, fmt.Errorf("rows iteration error: %w", err)
	}

	hasMore := len(feed) > limit
	if hasMore {
		feed = feed[:limit]
	}

	return FeedPage{Items: feed, HasMore: hasMore}, nil
}

func (r *PostRepository) GetPostByID(ctx context.Context, postID int) (*models.FeedItem, error) {
	var item models.FeedItem
	var mediaJSON []byte

	err := r.db.QueryRow(ctx, getPostByIDSQL, postID).Scan(
		&item.PostID,
		&item.PostType,
		&item.Content,
		&item.TextContent,
		&item.CreatedAt,
		&item.AuthorID,
		&item.AuthorName,
		&item.Rating,
		&item.LocationID,
		&item.LocationName,
		&item.LocationAddress,
		&mediaJSON,
	)

	if err != nil {
		// Differentiate between a database error and "post doesn't exist"
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("post not found")
		}
		return nil, fmt.Errorf("failed to get post by id: %w", err)
	}

	if err := json.Unmarshal(mediaJSON, &item.Media); err != nil {
		return nil, fmt.Errorf("failed to unmarshal media json: %w", err)
	}

	return &item, nil
}
