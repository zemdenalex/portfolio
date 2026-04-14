package logos

import (
	"errors"
	"time"
)

var (
	ErrSessionNotFound   = errors.New("session not found")
	ErrInvalidLogoID     = errors.New("logo_id must be between 1 and 30")
	ErrInvalidScore      = errors.New("score must be between 0 and 10")
	ErrSameLogoCompared  = errors.New("winner and loser must be different")
)

type Session struct {
	ID         string    `json:"id"`
	Label      *string   `json:"label"`
	CreatedAt  time.Time `json:"created_at"`
	LastSeenAt time.Time `json:"last_seen_at"`
}

type Rating struct {
	LogoID     int       `json:"logo_id"`
	Score      int       `json:"score"`
	IsFavorite bool      `json:"is_favorite"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type LogoStat struct {
	LogoID        int      `json:"logo_id"`
	AvgScore      *float64 `json:"avg_score"`
	RatingCount   int      `json:"rating_count"`
	FavoriteCount int      `json:"favorite_count"`
	Wins          int      `json:"wins"`
	Losses        int      `json:"losses"`
}

type AggregateStats struct {
	Logos            []LogoStat `json:"logos"`
	TotalSessions    int        `json:"total_sessions"`
	TotalRatings     int        `json:"total_ratings"`
	TotalComparisons int        `json:"total_comparisons"`
}

// SessionSummary is a lightweight overview of one rating session,
// with its top 5 picks (by score) for the by-session leaderboard.
type SessionSummary struct {
	ID           string    `json:"id"`
	Label        *string   `json:"label"`
	CreatedAt    time.Time `json:"created_at"`
	LastSeenAt   time.Time `json:"last_seen_at"`
	RatedCount   int       `json:"rated_count"`
	AvgScore     *float64  `json:"avg_score"`
	FavoriteIDs  []int     `json:"favorite_ids"`
	TopPicks     []TopPick `json:"top_picks"`
	Comparisons  int       `json:"comparisons"`
}

type TopPick struct {
	LogoID     int  `json:"logo_id"`
	Score      int  `json:"score"`
	IsFavorite bool `json:"is_favorite"`
}

type SessionData struct {
	Session     Session  `json:"session"`
	Ratings     []Rating `json:"ratings"`
	Favorites   []int    `json:"favorites"`
	Comparisons int      `json:"comparisons"`
}

// Request bodies

type CreateSessionRequest struct {
	Label *string `json:"label"`
}

type RateRequest struct {
	LogoID     int   `json:"logo_id"`
	Score      int   `json:"score"`
	IsFavorite *bool `json:"is_favorite"`
}

type CompareRequest struct {
	WinnerLogoID int `json:"winner_logo_id"`
	LoserLogoID  int `json:"loser_logo_id"`
}

type UpdateSessionRequest struct {
	Label *string `json:"label"`
}

func validLogoID(id int) bool { return id >= 1 && id <= 30 }
func validScore(s int) bool   { return s >= 0 && s <= 10 }
