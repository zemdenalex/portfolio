package logos

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

// CreateSession creates a new anonymous rating session.
func (s *Service) CreateSession(ctx context.Context, label *string) (*Session, error) {
	var sess Session
	err := s.db.QueryRow(ctx,
		`INSERT INTO logo_rating_sessions (label)
		 VALUES ($1)
		 RETURNING id, label, created_at, last_seen_at`,
		label,
	).Scan(&sess.ID, &sess.Label, &sess.CreatedAt, &sess.LastSeenAt)
	if err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}
	return &sess, nil
}

// GetSession returns session data including all ratings and comparison count.
func (s *Service) GetSession(ctx context.Context, sessionID string) (*SessionData, error) {
	// Touch last_seen_at, and fail if session doesn't exist
	var sess Session
	err := s.db.QueryRow(ctx,
		`UPDATE logo_rating_sessions
		 SET last_seen_at = NOW()
		 WHERE id = $1
		 RETURNING id, label, created_at, last_seen_at`,
		sessionID,
	).Scan(&sess.ID, &sess.Label, &sess.CreatedAt, &sess.LastSeenAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, fmt.Errorf("get session: %w", err)
	}

	// Ratings
	rows, err := s.db.Query(ctx,
		`SELECT logo_id, score, is_favorite, updated_at
		 FROM logo_ratings
		 WHERE session_id = $1
		 ORDER BY logo_id`,
		sessionID,
	)
	if err != nil {
		return nil, fmt.Errorf("list ratings: %w", err)
	}
	defer rows.Close()

	ratings := []Rating{}
	favorites := []int{}
	for rows.Next() {
		var r Rating
		if err := rows.Scan(&r.LogoID, &r.Score, &r.IsFavorite, &r.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan rating: %w", err)
		}
		ratings = append(ratings, r)
		if r.IsFavorite {
			favorites = append(favorites, r.LogoID)
		}
	}

	var compCount int
	err = s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM logo_comparisons WHERE session_id = $1`,
		sessionID,
	).Scan(&compCount)
	if err != nil {
		return nil, fmt.Errorf("count comparisons: %w", err)
	}

	return &SessionData{
		Session:     sess,
		Ratings:     ratings,
		Favorites:   favorites,
		Comparisons: compCount,
	}, nil
}

// UpdateSessionLabel updates the session's optional label.
func (s *Service) UpdateSessionLabel(ctx context.Context, sessionID string, label *string) error {
	tag, err := s.db.Exec(ctx,
		`UPDATE logo_rating_sessions SET label = $1, last_seen_at = NOW() WHERE id = $2`,
		label, sessionID,
	)
	if err != nil {
		return fmt.Errorf("update session: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrSessionNotFound
	}
	return nil
}

// Rate upserts a rating for a logo in the given session.
func (s *Service) Rate(ctx context.Context, sessionID string, req *RateRequest) error {
	if !validLogoID(req.LogoID) {
		return ErrInvalidLogoID
	}
	if !validScore(req.Score) {
		return ErrInvalidScore
	}

	// If is_favorite was not provided, keep existing (or default false on insert)
	isFav := false
	if req.IsFavorite != nil {
		isFav = *req.IsFavorite
	}

	var query string
	var args []any
	if req.IsFavorite == nil {
		// Preserve existing is_favorite on update
		query = `
			INSERT INTO logo_ratings (session_id, logo_id, score, is_favorite, updated_at)
			VALUES ($1, $2, $3, FALSE, NOW())
			ON CONFLICT (session_id, logo_id)
			DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()`
		args = []any{sessionID, req.LogoID, req.Score}
	} else {
		query = `
			INSERT INTO logo_ratings (session_id, logo_id, score, is_favorite, updated_at)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (session_id, logo_id)
			DO UPDATE SET score = EXCLUDED.score, is_favorite = EXCLUDED.is_favorite, updated_at = NOW()`
		args = []any{sessionID, req.LogoID, req.Score, isFav}
	}

	_, err := s.db.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("upsert rating: %w", err)
	}

	// Touch session last_seen_at
	_, _ = s.db.Exec(ctx,
		`UPDATE logo_rating_sessions SET last_seen_at = NOW() WHERE id = $1`, sessionID)
	return nil
}

// ToggleFavorite flips the is_favorite flag for a logo. Requires the logo to already be rated.
func (s *Service) SetFavorite(ctx context.Context, sessionID string, logoID int, isFavorite bool) error {
	if !validLogoID(logoID) {
		return ErrInvalidLogoID
	}
	// Upsert — if no rating exists, create one with score=0 + is_favorite
	_, err := s.db.Exec(ctx,
		`INSERT INTO logo_ratings (session_id, logo_id, score, is_favorite, updated_at)
		 VALUES ($1, $2, 0, $3, NOW())
		 ON CONFLICT (session_id, logo_id)
		 DO UPDATE SET is_favorite = EXCLUDED.is_favorite, updated_at = NOW()`,
		sessionID, logoID, isFavorite,
	)
	if err != nil {
		return fmt.Errorf("set favorite: %w", err)
	}
	_, _ = s.db.Exec(ctx,
		`UPDATE logo_rating_sessions SET last_seen_at = NOW() WHERE id = $1`, sessionID)
	return nil
}

// Compare records a head-to-head comparison result.
func (s *Service) Compare(ctx context.Context, sessionID string, req *CompareRequest) error {
	if !validLogoID(req.WinnerLogoID) || !validLogoID(req.LoserLogoID) {
		return ErrInvalidLogoID
	}
	if req.WinnerLogoID == req.LoserLogoID {
		return ErrSameLogoCompared
	}

	_, err := s.db.Exec(ctx,
		`INSERT INTO logo_comparisons (session_id, winner_logo_id, loser_logo_id)
		 VALUES ($1, $2, $3)`,
		sessionID, req.WinnerLogoID, req.LoserLogoID,
	)
	if err != nil {
		return fmt.Errorf("record comparison: %w", err)
	}
	_, _ = s.db.Exec(ctx,
		`UPDATE logo_rating_sessions SET last_seen_at = NOW() WHERE id = $1`, sessionID)
	return nil
}

// Stats returns aggregate stats across ALL sessions.
func (s *Service) Stats(ctx context.Context) (*AggregateStats, error) {
	// Per-logo aggregates
	rows, err := s.db.Query(ctx, `
		WITH r AS (
			SELECT logo_id,
			       AVG(score)::float AS avg_score,
			       COUNT(*)::int AS rating_count,
			       COUNT(*) FILTER (WHERE is_favorite)::int AS favorite_count
			FROM logo_ratings
			GROUP BY logo_id
		),
		w AS (
			SELECT winner_logo_id AS logo_id, COUNT(*)::int AS wins
			FROM logo_comparisons GROUP BY winner_logo_id
		),
		l AS (
			SELECT loser_logo_id AS logo_id, COUNT(*)::int AS losses
			FROM logo_comparisons GROUP BY loser_logo_id
		),
		ids AS (
			SELECT generate_series(1, 30) AS logo_id
		)
		SELECT ids.logo_id,
		       r.avg_score,
		       COALESCE(r.rating_count, 0),
		       COALESCE(r.favorite_count, 0),
		       COALESCE(w.wins, 0),
		       COALESCE(l.losses, 0)
		FROM ids
		LEFT JOIN r ON r.logo_id = ids.logo_id
		LEFT JOIN w ON w.logo_id = ids.logo_id
		LEFT JOIN l ON l.logo_id = ids.logo_id
		ORDER BY ids.logo_id
	`)
	if err != nil {
		return nil, fmt.Errorf("query per-logo stats: %w", err)
	}
	defer rows.Close()

	logos := []LogoStat{}
	for rows.Next() {
		var stat LogoStat
		if err := rows.Scan(&stat.LogoID, &stat.AvgScore, &stat.RatingCount,
			&stat.FavoriteCount, &stat.Wins, &stat.Losses); err != nil {
			return nil, fmt.Errorf("scan logo stat: %w", err)
		}
		logos = append(logos, stat)
	}

	var totalSessions, totalRatings, totalComparisons int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM logo_rating_sessions`).Scan(&totalSessions)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM logo_ratings`).Scan(&totalRatings)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM logo_comparisons`).Scan(&totalComparisons)

	return &AggregateStats{
		Logos:            logos,
		TotalSessions:    totalSessions,
		TotalRatings:     totalRatings,
		TotalComparisons: totalComparisons,
	}, nil
}

// ListSessions returns per-session summaries (label, rating count, top 5 picks, favorites).
// Only sessions with at least one rating are included.
func (s *Service) ListSessions(ctx context.Context) ([]SessionSummary, error) {
	// Pull all sessions that have ratings or comparisons
	rows, err := s.db.Query(ctx, `
		SELECT s.id, s.label, s.created_at, s.last_seen_at,
		       COUNT(r.logo_id)::int AS rated_count,
		       AVG(r.score)::float AS avg_score,
		       (SELECT COUNT(*) FROM logo_comparisons c WHERE c.session_id = s.id)::int AS comparisons
		FROM logo_rating_sessions s
		LEFT JOIN logo_ratings r ON r.session_id = s.id
		GROUP BY s.id
		HAVING COUNT(r.logo_id) > 0
		   OR (SELECT COUNT(*) FROM logo_comparisons c WHERE c.session_id = s.id) > 0
		ORDER BY s.last_seen_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list sessions: %w", err)
	}
	defer rows.Close()

	summaries := []SessionSummary{}
	for rows.Next() {
		var sum SessionSummary
		if err := rows.Scan(&sum.ID, &sum.Label, &sum.CreatedAt, &sum.LastSeenAt,
			&sum.RatedCount, &sum.AvgScore, &sum.Comparisons); err != nil {
			return nil, fmt.Errorf("scan session summary: %w", err)
		}
		sum.FavoriteIDs = []int{}
		sum.TopPicks = []TopPick{}
		summaries = append(summaries, sum)
	}

	// For each session, fetch top 5 picks + favorites (small N, so separate queries are fine)
	for i := range summaries {
		// Top 5 by score, ties broken by updated_at desc
		pickRows, err := s.db.Query(ctx, `
			SELECT logo_id, score, is_favorite
			FROM logo_ratings
			WHERE session_id = $1
			ORDER BY score DESC, updated_at DESC
			LIMIT 5
		`, summaries[i].ID)
		if err != nil {
			return nil, fmt.Errorf("session top picks: %w", err)
		}
		for pickRows.Next() {
			var p TopPick
			if err := pickRows.Scan(&p.LogoID, &p.Score, &p.IsFavorite); err != nil {
				pickRows.Close()
				return nil, fmt.Errorf("scan top pick: %w", err)
			}
			summaries[i].TopPicks = append(summaries[i].TopPicks, p)
		}
		pickRows.Close()

		// Favorites (separate so they're always surfaced even if not in top 5)
		favRows, err := s.db.Query(ctx, `
			SELECT logo_id FROM logo_ratings
			WHERE session_id = $1 AND is_favorite = TRUE
			ORDER BY updated_at DESC
		`, summaries[i].ID)
		if err != nil {
			return nil, fmt.Errorf("session favorites: %w", err)
		}
		for favRows.Next() {
			var id int
			if err := favRows.Scan(&id); err != nil {
				favRows.Close()
				return nil, fmt.Errorf("scan favorite id: %w", err)
			}
			summaries[i].FavoriteIDs = append(summaries[i].FavoriteIDs, id)
		}
		favRows.Close()
	}

	return summaries, nil
}
