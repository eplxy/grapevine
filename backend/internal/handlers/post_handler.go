package handlers

import (
	"encoding/json"
	"fmt"
	"grapevine/internal/database"
	"grapevine/internal/models"
	"grapevine/internal/responses"
	"net/http"
	"net/url"
	"strconv"
	"strings"

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
	LocationType  string  `json:"location_type"`
	Lat           float64 `json:"lat" binding:"required"`
	Lng           float64 `json:"lng" binding:"required"`
}

type CreateReviewRequest struct {
	Content     json.RawMessage `json:"content" swaggertype:"object"`
	TextContent string          `json:"text_content"`
	Rating      int             `json:"rating" binding:"required,min=1,max=5"`
	MediaURLs   []string        `json:"media_urls"`

	LocationInfo LocationUpsertInfo `json:"location" binding:"required"`
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

	for _, url := range req.MediaURLs {
		fileName, err := extractObjectNameFromURL(url)

		if err != nil {
			responses.WriteError(c, http.StatusInternalServerError, "incorrect_url_format", fmt.Sprintf("Failed to read storage object name from media url while moving out of temp: %s", err.Error()))
		}

		err = h.mediaRepo.MoveMediaFromTmpToPosts(c.Request.Context(), fileName)
		if err != nil {
			responses.WriteError(c, http.StatusInternalServerError, "storage_move_failure", fmt.Sprintf("Failed to move media out of temporary folder: %s", err.Error()))
			return
		}
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
		responses.WriteError(c, http.StatusInternalServerError, "location_error", "Failed to process location data")
		return
	}

	for _, url := range req.MediaURLs {
		fileName, err := extractObjectNameFromURL(url)

		if err != nil {
			responses.WriteError(c, http.StatusInternalServerError, "incorrect_url_format", fmt.Sprintf("Failed to read storage object name from media url while moving out of temp: %s", err.Error()))
		}

		err = h.mediaRepo.MoveMediaFromTmpToPosts(ctx, fileName)
		if err != nil {
			responses.WriteError(c, http.StatusInternalServerError, "storage_move_failure", fmt.Sprintf("Failed to move media out of temporary folder: %s", err.Error()))
			return
		}
	}

	postID, err := h.postRepo.CreateReview(
		ctx, userID, locationID, req.Rating, req.Content, req.TextContent, req.MediaURLs,
	)

	if err != nil {
		responses.WriteError(c, http.StatusInternalServerError, "creation_failed", "Failed to create review")
		return
	}

	c.JSON(http.StatusCreated, gin.H{"post_id": postID, "message": "Review created successfully"})
}

// GetHomeFeedHandler fetches the chronological feed of both Notes and Reviews.
// @Summary      Get Home Feed
// @Description  Returns paginated posts for the main feed.
// @Tags         posts
// @Produce      json
// @Param        limit query int false "Pagination limit" default(20)
// @Param        offset query int false "Pagination offset" default(0)
// @Success      200 {array} models.FeedItem
// @Failure      500 {object} map[string]string
// @Router       /posts [get]
func (h *PostHandler) GetHomeFeedHandler(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	feed, err := h.postRepo.GetHomeFeed(c.Request.Context(), limit, offset)
	if err != nil {
		responses.WriteError(c, http.StatusInternalServerError, "fetch_failed", fmt.Sprintf("Failed to load feed. err: %s", err))
		return
	}

	if feed == nil {
		feed = []models.FeedItem{}
	}

	c.JSON(http.StatusOK, gin.H{"data": feed})
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
		responses.WriteError(c, http.StatusInternalServerError, "fetch_failed", fmt.Sprintf("Failed to load post: %s", err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": post})
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
