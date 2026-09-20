package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

const socialSchema = `
CREATE TABLE IF NOT EXISTS comments (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	content TEXT NOT NULL,
	parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
	CONSTRAINT comments_content_not_empty CHECK (length(btrim(content)) > 0)
);
CREATE INDEX IF NOT EXISTS comments_post_created_idx ON comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS post_likes (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT post_likes_post_user_unique UNIQUE(post_id, user_id)
);
`

func EnsureSocialSchema(ctx context.Context, db *pgxpool.Pool) error {
	if _, err := db.Exec(ctx, socialSchema); err != nil {
		return fmt.Errorf("failed to initialize social schema: %w", err)
	}
	return nil
}
