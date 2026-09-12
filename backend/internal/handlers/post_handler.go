package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"grapevine/internal/database"
	"grapevine/internal/responses"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type PostHandler struct {
	postRepo     database.PostDomain
	locationRepo database.LocationDomain
	mediaRepo    database.MediaDomain
}

func NewPostHandler(postRepo database.PostDomain, locationRepo database.LocationDomain, mediaRepo database.MediaDomain) *PostHandler {
	return &PostHandler{
		postRepo:     postRepo,
		locationRepo: locationRepo,
		mediaRepo:    mediaRepo,
	}
}

type CreateNoteRequest struct {
	Content     json.RawMessage `json:"content" binding:"required" swaggertype:"object"`
	TextContent string          `json:"text_content"`
	MediaURLs   []string        `json:"media_urls"`
}

type LocationUpsertInfo struct {
	GooglePlaceID string  `json:"google_place_id" binding:"required"`
	Name          string  `json:"name" binding:"required"`
	Address       string  `json:"address" binding:"required"`
	LocationType  string  `json:"type"`
	Lat           float64 `json:"lat"`
	Lng           float64 `json:"lng"`
}

type CreateReviewRequest struct {
	Content     json.RawMessage `json:"content" swaggertype:"object"`
	TextContent string          `json:"text_content"`
	Rating      int             `json:"rating" binding:"required,min=1,max=5"`
	MediaURLs   []string        `json:"media_urls"`

	LocationInfo LocationUpsertInfo `json:"location" binding:"required"`
}

const (
	defaultFeedLimit = 10
	maxFeedLimit     = 50
)

type feedCursorPayload struct {
	CreatedAt time.Time `json:"created_at"`
	PostID    int       `json:"post_id"`
}

// CreateNoteHandler creates a standalone text/media post.
// @Summary      Create a Note
// @Description  Create a post not attached to a location.
// @Tags         posts
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request body CreateNoteRequest true "Note payload"
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,500 {object} map[string]string
// @Router       /posts/note [post]
func (h *PostHandler) CreateNoteHandler(c *gin.Context) {

	userID, err := GetUserIDAsInt(c)
	if err != nil {
		responses.WriteError(c, http.StatusUnauthorized, "unauthorized", err.Error())
		return
	}

	// validate request shape
	var req CreateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.WriteBadRequest(c, "invalid_request", err.Error())
		return
	}

	// validate request.content shape
	var rootNode struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(req.Content, &rootNode); err != nil || rootNode.Type != "doc" {
		responses.WriteBadRequest(c, "invalid_content", "Content must be a valid document format")
		return
	}

	// validate no empty notes via text content
	trimmedText := strings.TrimSpace(req.TextContent)

	if len(trimmedText) == 0 && len(req.MediaURLs) == 0 {
		responses.WriteBadRequest(c, "empty_post", "A note must contain either text or media")
		return
	}

	if err := h.finalizeMedia(c.Request.Context(), req.MediaURLs); err != nil {
		code := "storage_move_failure"
		if strings.HasPrefix(err.Error(), "invalid media URL:") {
			code = "incorrect_url_format"
		}
		responses.WriteError(c, http.StatusInternalServerError, code, err.Error())
		return
	}

	postID, err := h.postRepo.CreateNote(c.Request.Context(), userID, req.Content, trimmedText, req.MediaURLs)
	if err != nil {
		responses.WriteError(c, http.StatusInternalServerError, "creation_failed", fmt.Sprintf("Failed to create note: %s", err.Error()))
		return
	}

	c.JSON(http.StatusCreated, gin.H{"post_id": postID, "message": "Note created successfully"})
}

// CreateReviewHandler upserts the location cache and saves the review.
// @Summary      Create a Review
// @Description  Saves Google location data to cache, then creates a review attached to it.
// @Tags         posts
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request body CreateReviewRequest true "Review payload"
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,500 {object} map[string]string
// @Router       /posts/review [post]
func (h *PostHandler) CreateReviewHandler(c *gin.Context) {
	userID, err := GetUserIDAsInt(c)
	if err != nil {
		responses.WriteError(c, http.StatusUnauthorized, "unauthorized", err.Error())
		return
	}

	// validate request shape
	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.WriteBadRequest(c, "invalid_request", err.Error())
		return
	}

	// validate request.content shape
	var rootNode struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(req.Content, &rootNode); err != nil || rootNode.Type != "doc" {
		responses.WriteBadRequest(c, "invalid_content", "Content must be a valid document format")
		return
	}

	ctx := c.Request.Context()

	locInfo := req.LocationInfo
	locationID, err := h.locationRepo.UpsertLocation(
		ctx, locInfo.GooglePlaceID, locInfo.Name, locInfo.Address, locInfo.LocationType, locInfo.Lat, locInfo.Lng,
	)
	if err != nil {
		fmt.Println(err.Error())
		responses.WriteError(c, http.StatusInternalServerError, "location_error", "Failed to process location data")
		return
	}

	if err := h.finalizeMedia(ctx, req.MediaURLs); err != nil {
		code := "storage_move_failure"
		if strings.HasPrefix(err.Error(), "invalid media URL:") {
			code = "incorrect_url_format"
		}
		responses.WriteError(c, http.StatusInternalServerError, code, err.Error())
		return
	}

	postID, err := h.postRepo.CreateReview(
		ctx, userID, locationID, req.Rating, req.Content, req.TextContent, req.MediaURLs,
	)

	if err != nil {
		fmt.Println(err.Error())
		responses.WriteError(c, http.StatusInternalServerError, "creation_failed", "Failed to create review")
		return
	}

	c.JSON(http.StatusCreated, gin.H{"post_id": postID, "message": "Review created successfully"})
}

func (h *PostHandler) finalizeMedia(ctx context.Context, mediaURLs []string) error {
	for _, rawURL := range mediaURLs {
		fileName, err := extractObjectNameFromURL(rawURL)
		if err != nil {
			return fmt.Errorf("invalid media URL: %w", err)
		}
		if err := h.mediaRepo.MoveMediaFromTmpToPosts(ctx, fileName); err != nil {
			return fmt.Errorf("failed to finalize media %q: %w", fileName, err)
		}
	}
	return nil
}

// GetHomeFeedHandler fetches the chronological feed of both Notes and Reviews.
// @Summary      Get Home Feed
// @Description  Returns paginated posts for the main feed.
// @Tags         posts
// @Produce      json
// @Param        limit query int false "Pagination limit" default(10)
// @Param        cursor query string false "Opaque cursor returned by the previous page"
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} map[string]string
// @Router       /posts [get]
func (h *PostHandler) GetHomeFeedHandler(c *gin.Context) {
	limit, err := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultFeedLimit)))
	if err != nil || limit < 1 || limit > maxFeedLimit {
		responses.WriteBadRequest(c, "invalid_limit", fmt.Sprintf("limit must be between 1 and %d", maxFeedLimit))
		return
	}

	cursor, err := decodeFeedCursor(c.Query("cursor"))
	if err != nil {
		responses.WriteBadRequest(c, "invalid_cursor", "cursor is invalid")
		return
	}

	page, err := h.postRepo.GetHomeFeed(c.Request.Context(), limit, cursor)
	if err != nil {
		responses.WriteError(c, http.StatusInternalServerError, "fetch_failed", fmt.Sprintf("Failed to load feed. %v", err))
		return
	}

	nextCursor := ""
	if page.HasMore && len(page.Items) > 0 {
		last := page.Items[len(page.Items)-1]
		nextCursor, err = encodeFeedCursor(database.FeedCursor{
			CreatedAt: last.CreatedAt,
			PostID:    last.PostID,
		})
		if err != nil {
			responses.WriteError(c, http.StatusInternalServerError, "cursor_failed", "Failed to create feed cursor.")
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": page.Items,
		"pagination": gin.H{
			"has_more":    page.HasMore,
			"next_cursor": nextCursor,
		},
	})
}

func encodeFeedCursor(cursor database.FeedCursor) (string, error) {
	payload, err := json.Marshal(feedCursorPayload{CreatedAt: cursor.CreatedAt, PostID: cursor.PostID})
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(payload), nil
}

func decodeFeedCursor(raw string) (*database.FeedCursor, error) {
	if raw == "" {
		return nil, nil
	}

	payload, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil {
		return nil, err
	}

	var decoded feedCursorPayload
	if err := json.Unmarshal(payload, &decoded); err != nil {
		return nil, err
	}
	if decoded.PostID < 1 || decoded.CreatedAt.IsZero() {
		return nil, errors.New("cursor fields are invalid")
	}

	return &database.FeedCursor{CreatedAt: decoded.CreatedAt, PostID: decoded.PostID}, nil
}

// GetPostByIDHandler fetches a single post (Note or Review) by its ID.
// @Summary      Get Post by ID
// @Description  Fetches post details including media and location info.
// @Tags         posts
// @Produce      json
// @Param        id path int true "Post ID"
// @Success      200 {object} models.FeedItem
// @Failure      400,404,500 {object} map[string]string
// @Router       /posts/{id} [get]
func (h *PostHandler) GetPostByIDHandler(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		responses.WriteBadRequest(c, "invalid_id", "Post ID must be a number")
		return
	}

	post, err := h.postRepo.GetPostByID(c.Request.Context(), postID)
	if err != nil {
		if err.Error() == "post not found" {
			responses.WriteError(c, http.StatusNotFound, "not_found", "Post does not exist")
			return
		}
		responses.WriteError(c, http.StatusInternalServerError, "fetch_failed", "Failed to load post")
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// DeletePostHandler deletes a post owned by the authenticated user.
// @Summary      Delete Post
// @Description  Deletes a note or review and its associated media.
// @Tags         posts
// @Security     BearerAuth
// @Produce      json
// @Param        id path int true "Post ID"
// @Success      200 {object} map[string]string
// @Failure      400,401,404,500 {object} map[string]string
// @Router       /posts/{id} [delete]
func (h *PostHandler) DeletePostHandler(c *gin.Context) {
	userID, err := GetUserIDAsInt(c)
	if err != nil {
		responses.WriteError(c, http.StatusUnauthorized, "unauthorized", err.Error())
		return
	}

	postID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		responses.WriteBadRequest(c, "invalid_id", "Post ID must be a number")
		return
	}

	mediaURLs, err := h.postRepo.DeletePost(c.Request.Context(), postID, userID)
	if err != nil {
		if err.Error() == "post not found" {
			responses.WriteError(c, http.StatusNotFound, "not_found", "Post does not exist")
			return
		}
		responses.WriteError(c, http.StatusInternalServerError, "deletion_failed", "Failed to delete post")
		return
	}

	for _, mediaURL := range mediaURLs {
		fileName, err := extractObjectNameFromURL(mediaURL)
		if err != nil {
			responses.WriteError(c, http.StatusInternalServerError, "media_cleanup_failed", err.Error())
			return
		}
		if err := h.mediaRepo.DeleteMedia(c.Request.Context(), fileName); err != nil {
			responses.WriteError(c, http.StatusInternalServerError, "media_cleanup_failed", err.Error())
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

func extractObjectNameFromURL(rawURL string) (string, error) {
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("failed to parse url: %w", err)
	}

	// parsedURL.Path will look like: "/bucket-name/folder-name/fileName.extension"
	parts := strings.Split(strings.TrimPrefix(parsedURL.Path, "/"), "/")
	objectName := parts[len(parts)-1]
	if !strings.Contains(objectName, ".") {
		return "", fmt.Errorf("invalid storage url path, could not find name and extension: %s", parsedURL.Path)
	}

	return objectName, nil
}
