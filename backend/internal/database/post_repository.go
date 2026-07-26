package database

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"grapevine/internal/models"

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

type PostDomain interface {
	CreateNote(ctx context.Context, userID int, content json.RawMessage, textContent string, mediaURLs []string) (int, error)
	CreateReview(ctx context.Context, userID, locationID int, rating int, content json.RawMessage, text_content string, mediaURLs []string) (int, error)
	GetHomeFeed(ctx context.Context, limit, offset int) ([]models.FeedItem, error)
	GetPostByID(ctx context.Context, postID int) (*models.FeedItem, error)
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
		INSERT INTO reviews (post_id, location_id, rating)
		VALUES ($1, $2, $3)`

	_, err = tx.Exec(ctx, reviewQuery, postID, locationID, rating)
	if err != nil {
		return 0, fmt.Errorf("failed to insert review details: %w", err)
	}

	if len(mediaURLs) > 0 {
		mediaQuery := `INSERT INTO post_media (post_id, url, type) VALUES ($1, $2, $3)`
		for _, url := range mediaURLs {
			_, err = tx.Exec(ctx, mediaQuery, postID, url, "image")
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
func (r *PostRepository) GetHomeFeed(ctx context.Context, limit, offset int) ([]models.FeedItem, error) {
	rows, err := r.db.Query(ctx, getHomeFeedSQL, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query home feed: %w", err)
	}
	defer rows.Close()

	var feed []models.FeedItem

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
			&mediaJSON,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan feed row: %w", err)
		}

		if err := json.Unmarshal(mediaJSON, &item.Media); err != nil {
			return nil, fmt.Errorf("failed to unmarshal media json: %w", err)
		}

		feed = append(feed, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return feed, nil
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
