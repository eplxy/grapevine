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

//go:embed queries/posts/get_comments.sql
var getCommentsSQL string

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

type CommentCursor struct {
	CreatedAt time.Time
	CommentID int
}

type CommentPage struct {
	Items   []models.Comment
	HasMore bool
}

type PostDomain interface {
	CreateNote(ctx context.Context, userID int, content json.RawMessage, textContent string, mediaURLs []string) (int, error)
	CreateReview(ctx context.Context, userID, locationID int, rating float64, content json.RawMessage, text_content string, mediaURLs []string) (int, error)
	DeletePost(ctx context.Context, postID, userID int) ([]string, error)
	CreateComment(ctx context.Context, postID, userID int, content string, parentID int) (int, error)
	DeleteComment(ctx context.Context, postID, commentID, userID int) error
	LikePost(ctx context.Context, postID, userID int) error
	UnlikePost(ctx context.Context, postID, userID int) error
	GetHomeFeed(ctx context.Context, limit int, cursor *FeedCursor) (FeedPage, error)
	GetPostByID(ctx context.Context, postID int) (*models.FeedItem, error)
	GetComments(ctx context.Context, postID, limit int, cursor *CommentCursor) (CommentPage, error)
}

func (r *PostRepository) GetComments(ctx context.Context, postID, limit int, cursor *CommentCursor) (CommentPage, error) {
	var postExists bool
	if err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1)`, postID).Scan(&postExists); err != nil {
		return CommentPage{}, fmt.Errorf("failed to verify post: %w", err)
	}
	if !postExists {
		return CommentPage{}, fmt.Errorf("post not found")
	}

	var cursorCreatedAt *time.Time
	cursorCommentID := 0
	if cursor != nil {
		cursorCreatedAt = &cursor.CreatedAt
		cursorCommentID = cursor.CommentID
	}

	rows, err := r.db.Query(ctx, getCommentsSQL, postID, cursorCreatedAt, cursorCommentID, limit+1)
	if err != nil {
		return CommentPage{}, fmt.Errorf("failed to query comments: %w", err)
	}
	defer rows.Close()

	comments := make([]models.Comment, 0, limit+1)
	for rows.Next() {
		var comment models.Comment
		var parentID *int
		if err := rows.Scan(
			&comment.ID,
			&comment.CreatedAt,
			&comment.PostID,
			&comment.UserID,
			&comment.AuthorName,
			&comment.Content,
			&parentID,
		); err != nil {
			return CommentPage{}, fmt.Errorf("failed to scan comment: %w", err)
		}
		if parentID != nil {
			comment.ParentID = *parentID
		}
		comments = append(comments, comment)
	}
	if err := rows.Err(); err != nil {
		return CommentPage{}, fmt.Errorf("comment rows iteration error: %w", err)
	}

	hasMore := len(comments) > limit
	if hasMore {
		comments = comments[:limit]
	}
	return CommentPage{Items: comments, HasMore: hasMore}, nil
}

// DeletePost removes an owned post and its dependent rows in one transaction.
// Media cleanup is queued in the same transaction before the post is committed.
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
	for _, mediaURL := range mediaURLs {
		if _, err := tx.Exec(ctx, `
			INSERT INTO media_cleanup_outbox (media_url)
			VALUES ($1)
			ON CONFLICT (media_url) DO NOTHING
		`, mediaURL); err != nil {
			return nil, fmt.Errorf("failed to queue media cleanup: %w", err)
		}
	}
	// DELETE is intentionally unconditional: notes have no matching review row,
	// and PostgreSQL treats that as a successful zero-row delete.
	if _, err := tx.Exec(ctx, `DELETE FROM reviews WHERE id = $1`, postID); err != nil {
		return nil, fmt.Errorf("failed to delete review details: %w", err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM comments WHERE post_id = $1`, postID); err != nil {
		return nil, fmt.Errorf("failed to delete post comments: %w", err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM post_likes WHERE post_id = $1`, postID); err != nil {
		return nil, fmt.Errorf("failed to delete post likes: %w", err)
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

func (r *PostRepository) CreateComment(ctx context.Context, postID, userID int, content string, parentID int) (int, error) {
	var exists bool
	if err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1)`, postID).Scan(&exists); err != nil {
		return 0, fmt.Errorf("failed to verify post: %w", err)
	}
	if !exists {
		return 0, fmt.Errorf("post not found")
	}

	var commentID int
	var err error
	if parentID > 0 {
		err = r.db.QueryRow(ctx, `
			INSERT INTO comments (post_id, user_id, content, parent_id)
			SELECT $1, $2, $3, $4
			WHERE EXISTS (
				SELECT 1 FROM comments WHERE id = $4 AND post_id = $1
			)
			RETURNING id
		`, postID, userID, content, parentID).Scan(&commentID)
		if err == pgx.ErrNoRows {
			return 0, fmt.Errorf("parent comment not found")
		}
	} else {
		err = r.db.QueryRow(ctx, `
			INSERT INTO comments (post_id, user_id, content)
			VALUES ($1, $2, $3)
			RETURNING id
		`, postID, userID, content).Scan(&commentID)
	}
	if err != nil {
		return 0, fmt.Errorf("failed to create comment: %w", err)
	}
	return commentID, nil
}

func (r *PostRepository) DeleteComment(ctx context.Context, postID, commentID, userID int) error {
	result, err := r.db.Exec(ctx, `DELETE FROM comments WHERE id = $1 AND post_id = $2 AND user_id = $3`, commentID, postID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}
	if result.RowsAffected() != 1 {
		return fmt.Errorf("comment not found")
	}
	return nil
}

func (r *PostRepository) LikePost(ctx context.Context, postID, userID int) error {
	var exists bool
	if err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1)`, postID).Scan(&exists); err != nil {
		return fmt.Errorf("failed to verify post: %w", err)
	}
	if !exists {
		return fmt.Errorf("post not found")
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO post_likes (post_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT (post_id, user_id) DO NOTHING
	`, postID, userID)
	if err != nil {
		return fmt.Errorf("failed to like post: %w", err)
	}
	return nil
}

func (r *PostRepository) UnlikePost(ctx context.Context, postID, userID int) error {
	var exists bool
	if err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1)`, postID).Scan(&exists); err != nil {
		return fmt.Errorf("failed to verify post: %w", err)
	}
	if !exists {
		return fmt.Errorf("post not found")
	}
	if _, err := r.db.Exec(ctx, `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, postID, userID); err != nil {
		return fmt.Errorf("failed to unlike post: %w", err)
	}
	return nil
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
func (r *PostRepository) CreateReview(ctx context.Context, userID, locationID int, rating float64, content json.RawMessage, textContent string, mediaURLs []string) (int, error) {
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
			&item.CommentCount,
			&item.LikeCount,
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
		&item.CommentCount,
		&item.LikeCount,
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
