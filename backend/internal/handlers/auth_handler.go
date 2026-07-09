package handlers

import (
	"fmt"
	"grapevine/internal/database"
	"grapevine/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	repo   database.UserDomain
	isProd bool
}

func NewAuthHandler(repo database.UserDomain, isProd bool) *AuthHandler {
	return &AuthHandler{
		repo:   repo,
		isProd: isProd,
	}
}

type authRequest struct {
	Name     string `json:"name" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

// RegisterHandler creates a new user account.
// @Summary      Register a new user
// @Description  Create a new user account with a name and password.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body authRequest true "Registration payload"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      409 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /auth/register [post]
func (h *AuthHandler) RegisterHandler(c *gin.Context) {
	var req authRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process security credentials"})
		return
	}

	id, err := h.repo.CreateUser(c.Request.Context(), req.Name, string(hashedPassword))
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("A user with the name '%s' is already registered. Error: %v", req.Name, err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"user_id": id, "message": "Registration successful"})
}

// LoginHandler authenticates a user and issues tokens.
// @Summary      Login a user
// @Description  Authenticate a user with their name and password, then return an access token and set a refresh token cookie.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body authRequest true "Login payload"
// @Success      200 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /auth/login [post]
func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req authRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, hashedPassword, err := h.repo.GetUserByName(c.Request.Context(), req.Name)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Issue Tokens
	accessToken, err := utils.GenerateAccessToken(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Set the long-lived refresh token inside an HttpOnly Cookie
	h.setRefreshCookie(c, refreshToken, 7*24*60*60)

	// Send short-lived access token directly to React state memory
	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user_id":      userID,
	})
}

// RefreshHandler rotates a new access token from the refresh cookie.
// @Summary      Refresh access token
// @Description  Validate the refresh token cookie and issue a new access token.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        refresh_token header string true "Refresh token cookie value"
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} map[string]string
// @Router       /auth/refresh [post]
func (h *AuthHandler) RefreshHandler(c *gin.Context) {
	cookieToken, err := c.Cookie("refresh_token")
	if err != nil || cookieToken == "" {
		c.JSON(http.StatusOK, gin.H{"access_token": ""})
		return
	}

	claims, err := utils.ValidateToken(cookieToken)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"access_token": ""})
		return
	}

	// token is valid, issue a new short-lived access token
	newAccessToken, err := utils.GenerateAccessToken(claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rotate access token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
	})
}

// MeHandler returns the authenticated user's identity.
// @Summary      Get current user session
// @Description  Return the current authenticated user's id.
// @Tags         auth
// @Security     BearerAuth
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /auth/me [get]
func (h *AuthHandler) MeHandler(c *gin.Context) {

	userID, exists := c.Get("userID")

	if !exists {
		// Return 200 OK to silence the browser console,
		// but tell the frontend they aren't logged in.
		c.JSON(http.StatusOK, gin.H{
			"isAuthenticated": false,
			"user":            nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":       userID,
		"authenticated": true,
	})
}

// @Summary      Log out of the current user session
// @Description  Removes the refresh token cookie
// @Tags         auth
// @Security     BearerAuth
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /auth/logout [post]
func (h *AuthHandler) LogoutHandler(c *gin.Context) {
	h.clearRefreshCookie(c)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

func (h *AuthHandler) getCookieDomain() string {
	if h.isProd {
		return "onrender.com"
	}
	return "localhost"
}

func (h *AuthHandler) setRefreshCookie(c *gin.Context, token string, maxAge int) {
	sameSiteMode := http.SameSiteLaxMode

	if h.isProd {
		sameSiteMode = http.SameSiteNoneMode // needed for vercel to render communication
	}
	c.SetSameSite(sameSiteMode)

	c.SetCookie(
		"refresh_token",
		token,
		maxAge,
		"/",
		h.getCookieDomain(),
		h.isProd, // Secure=true in production (required if SameSite=None)
		true,     // HttpOnly=true
	)
}

func (h *AuthHandler) clearRefreshCookie(c *gin.Context) {
	sameSiteMode := http.SameSiteLaxMode

	if h.isProd {
		sameSiteMode = http.SameSiteNoneMode // needed for vercel to render communication
	}

	c.SetSameSite(sameSiteMode)

	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/",
		h.getCookieDomain(),
		h.isProd,
		true,
	)
}
