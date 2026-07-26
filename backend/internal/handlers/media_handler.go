package handlers

import (
	"grapevine/internal/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MediaHandler struct {
	MediaRepo database.MediaDomain
}

type UploadURLResponse struct {
	SignedURL string `json:"signedUrl"`
	PublicURL string `json:"publicUrl"`
}

func NewMediaHandler(mediaRepo database.MediaDomain) *MediaHandler {
	return &MediaHandler{
		MediaRepo: mediaRepo,
	}
}

// GetUploadURLHandler godoc
// @Summary      Generate GCS signed URL
// @Description  Generates a temporary signed URL to upload media directly to Google Cloud Storage from the frontend. Returns both the signed URL for the PUT request and the future public URL.
// @Tags         media
// @Produce      json
// @Security     BearerAuth
// @Param        fileName    query     string  true  "The name of the file (e.g., review-pic.jpg)"
// @Param        contentType query     string  true  "The exact MIME type of the file (e.g., image/jpeg)"
// @Success      200         {object}  UploadURLResponse "Successfully generated URLs"
// @Failure      400         {object}  map[string]string "Missing fileName or contentType"
// @Failure      500         {object}  map[string]string "Failed to generate upload URL"
// @Router       /media/upload-url [get]
func (h *MediaHandler) GetUploadURLHandler(c *gin.Context) {
	fileName := c.Query("fileName")
	contentType := c.Query("contentType")

	if fileName == "" || contentType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "fileName and contentType are required",
		})
		return
	}

	signedURL, publicURL, err := h.MediaRepo.GenerateUploadURL(fileName, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate upload URL",
		})
		return
	}

	c.JSON(http.StatusOK, UploadURLResponse{
		SignedURL: signedURL,
		PublicURL: publicURL,
	})
}
