package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"grapevine/internal/database"
	"grapevine/internal/models"

	"github.com/gin-gonic/gin"
)

type mediaRepoStub struct {
	moved []string
	err   error
}

type postRepoStub struct {
	commentID int
	liked     bool
}

func (s *postRepoStub) CreateNote(context.Context, int, json.RawMessage, string, []string) (int, error) {
	return 0, nil
}
func (s *postRepoStub) CreateReview(context.Context, int, int, float64, json.RawMessage, string, []string) (int, error) {
	return 0, nil
}
func (s *postRepoStub) DeletePost(context.Context, int, int) ([]string, error) { return nil, nil }
func (s *postRepoStub) CreateComment(context.Context, int, int, string, int) (int, error) {
	s.commentID++
	return s.commentID, nil
}
func (s *postRepoStub) DeleteComment(context.Context, int, int, int) error { return nil }
func (s *postRepoStub) LikePost(context.Context, int, int) error {
	s.liked = true
	return nil
}
func (s *postRepoStub) UnlikePost(context.Context, int, int) error {
	s.liked = false
	return nil
}
func (s *postRepoStub) GetHomeFeed(context.Context, int, *database.FeedCursor) (database.FeedPage, error) {
	return database.FeedPage{}, nil
}
func (s *postRepoStub) GetPostByID(context.Context, int) (*models.FeedItem, error) {
	return nil, nil
}
func (s *postRepoStub) GetComments(context.Context, int, int, *database.CommentCursor) (database.CommentPage, error) {
	return database.CommentPage{}, nil
}

func TestFeedCursorRoundTrip(t *testing.T) {
	createdAt := time.Date(2026, time.September, 11, 19, 52, 0, 0, time.UTC)
	cursor := database.FeedCursor{CreatedAt: createdAt, PostID: 42}

	encoded, err := encodeFeedCursor(cursor)
	if err != nil {
		t.Fatalf("encodeFeedCursor returned an error: %v", err)
	}

	decoded, err := decodeFeedCursor(encoded)
	if err != nil {
		t.Fatalf("decodeFeedCursor returned an error: %v", err)
	}
	if decoded.PostID != cursor.PostID || !decoded.CreatedAt.Equal(cursor.CreatedAt) {
		t.Fatalf("decoded cursor = %#v, want %#v", decoded, cursor)
	}
}

func TestDecodeFeedCursorRejectsInvalidValues(t *testing.T) {
	if _, err := decodeFeedCursor("not-a-cursor"); err == nil {
		t.Fatal("decodeFeedCursor accepted malformed input")
	}
}

func (s *mediaRepoStub) GenerateUploadURL(string, string) (string, string, error) {
	return "", "", nil
}

func (s *mediaRepoStub) MoveMediaFromTmpToPosts(_ context.Context, fileName string) error {
	s.moved = append(s.moved, fileName)
	return s.err
}

func (s *mediaRepoStub) DeleteMedia(_ context.Context, fileName string) error {
	s.moved = append(s.moved, fileName)
	return s.err
}

func TestFinalizeMedia(t *testing.T) {
	repo := &mediaRepoStub{}
	handler := &PostHandler{mediaRepo: repo}

	err := handler.finalizeMedia(context.Background(), []string{
		"https://storage.googleapis.com/bucket/post/photo-one.jpg",
		"https://storage.googleapis.com/bucket/post/photo-two.jpg",
	})
	if err != nil {
		t.Fatalf("finalizeMedia returned an error: %v", err)
	}

	if len(repo.moved) != 2 || repo.moved[0] != "photo-one.jpg" || repo.moved[1] != "photo-two.jpg" {
		t.Fatalf("moved files = %#v", repo.moved)
	}
}

func TestFinalizeMediaReturnsInvalidURLError(t *testing.T) {
	repo := &mediaRepoStub{}
	handler := &PostHandler{mediaRepo: repo}

	err := handler.finalizeMedia(context.Background(), []string{"https://storage.googleapis.com/bucket/post/no-extension"})
	if err == nil {
		t.Fatal("finalizeMedia succeeded for an invalid URL")
	}
	if repo.moved != nil {
		t.Fatalf("moved files = %#v, want no moves", repo.moved)
	}
}

func TestFinalizeMediaReturnsMoveError(t *testing.T) {
	expectedErr := errors.New("storage unavailable")
	repo := &mediaRepoStub{err: expectedErr}
	handler := &PostHandler{mediaRepo: repo}

	err := handler.finalizeMedia(context.Background(), []string{
		"https://storage.googleapis.com/bucket/post/photo.jpg",
	})
	if err == nil || !errors.Is(err, expectedErr) {
		t.Fatalf("finalizeMedia error = %v, want wrapped storage error", err)
	}
}

func TestCreateCommentHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &postRepoStub{}
	handler := &PostHandler{postRepo: repo}
	router := gin.New()
	router.POST("/posts/:id/comments", func(c *gin.Context) {
		c.Set("userID", "7")
		handler.CreateCommentHandler(c)
	})

	req := httptest.NewRequest(http.MethodPost, "/posts/42/comments", strings.NewReader(`{"content":"hello","parent_id":0}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated || !strings.Contains(rec.Body.String(), `"comment_id":1`) {
		t.Fatalf("response = %d %s", rec.Code, rec.Body.String())
	}
}

func TestValidateCommentContent(t *testing.T) {
	if err := validateCommentContent(strings.Repeat("a", maxCommentLength)); err != nil {
		t.Fatalf("validateCommentContent rejected max-length content: %v", err)
	}
	if err := validateCommentContent(strings.Repeat("a", maxCommentLength+1)); err == nil {
		t.Fatal("validateCommentContent accepted content over the maximum length")
	}
	if err := validateCommentContent(strings.Repeat("界", maxCommentLength)); err != nil {
		t.Fatalf("validateCommentContent rejected max-length Unicode content: %v", err)
	}
	if err := validateCommentContent("   "); err == nil {
		t.Fatal("validateCommentContent accepted whitespace-only content")
	}
}

func TestCreateCommentHandlerRejectsOversizedContent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := &PostHandler{postRepo: &postRepoStub{}}
	router := gin.New()
	router.POST("/posts/:id/comments", func(c *gin.Context) {
		c.Set("userID", "7")
		handler.CreateCommentHandler(c)
	})

	req := httptest.NewRequest(
		http.MethodPost,
		"/posts/42/comments",
		strings.NewReader(`{"content":"`+strings.Repeat("a", maxCommentLength+1)+`"}`),
	)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body = %s", rec.Code, http.StatusBadRequest, rec.Body.String())
	}
}

func TestCommentCursorRoundTrip(t *testing.T) {
	createdAt := time.Date(2026, time.September, 20, 12, 0, 0, 0, time.UTC)
	cursor := database.CommentCursor{CreatedAt: createdAt, CommentID: 9}

	encoded, err := encodeCommentCursor(cursor)
	if err != nil {
		t.Fatalf("encodeCommentCursor returned an error: %v", err)
	}
	decoded, err := decodeCommentCursor(encoded)
	if err != nil {
		t.Fatalf("decodeCommentCursor returned an error: %v", err)
	}
	if decoded.CommentID != cursor.CommentID || !decoded.CreatedAt.Equal(cursor.CreatedAt) {
		t.Fatalf("decoded cursor = %#v, want %#v", decoded, cursor)
	}
}

func TestLikePostHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &postRepoStub{}
	handler := &PostHandler{postRepo: repo}
	router := gin.New()
	router.POST("/posts/:id/like", func(c *gin.Context) {
		c.Set("userID", "7")
		handler.LikePostHandler(c)
	})

	req := httptest.NewRequest(http.MethodPost, "/posts/42/like", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK || !repo.liked {
		t.Fatalf("response = %d %s, liked = %v", rec.Code, rec.Body.String(), repo.liked)
	}
}
