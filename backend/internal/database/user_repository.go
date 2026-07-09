package database

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

type UserDomain interface {
	CreateUser(ctx context.Context, name, passwordHash string) (string, error)
	GetUserByName(ctx context.Context, name string) (string, string, error) // returns id, password_hash, error
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(ctx context.Context, name, passwordHash string) (string, error) {
	query := `
		INSERT INTO users (name, password_hash) 
		VALUES ($1, $2) 
		RETURNING id`

	var id string
	err := r.db.QueryRow(ctx, query, name, passwordHash).Scan(&id)
	if err != nil { // already exists
		return "", err
	}

	return id, nil
}

func (r *UserRepository) GetUserByName(ctx context.Context, name string) (string, string, error) {
	query := `
		SELECT id, password_hash 
		FROM users 
		WHERE name = $1`

	var id, hash string
	err := r.db.QueryRow(ctx, query, name).Scan(&id, &hash)
	if err != nil {
		return "", "", err
	}

	return id, hash, nil
}
