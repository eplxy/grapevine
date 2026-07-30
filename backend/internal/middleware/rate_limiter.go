package middleware

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type IPRateLimiter struct {
	ips map[string]*rate.Limiter
	mu  *sync.RWMutex
	r   rate.Limit // Requests allowed per second
	b   int        // Maximum burst size
}

func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	return &IPRateLimiter{
		ips: make(map[string]*rate.Limiter),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}
}

// GetLimiter retrieves or creates a new limiter for a specific IP.
func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.RLock()
	limiter, exists := i.ips[ip]
	i.mu.RUnlock()

	if !exists {
		i.mu.Lock()
		// Double-check in case another goroutine created it while we waited for the write lock
		limiter, exists = i.ips[ip]
		if !exists {
			limiter = rate.NewLimiter(i.r, i.b)
			i.ips[ip] = limiter
		}
		i.mu.Unlock()
	}

	return limiter
}

func RateLimitMiddleware(limiter *IPRateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		l := limiter.GetLimiter(ip)

		if !l.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate_limit_exceeded",
				"message": "Too many requests. Please try again later.",
			})
			return
		}

		c.Next()
	}
}
