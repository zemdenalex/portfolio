package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	db     *pgxpool.Pool
	secret []byte
	expiry time.Duration
}

func NewService(db *pgxpool.Pool, secret string, expiry time.Duration) *Service {
	return &Service{
		db:     db,
		secret: []byte(secret),
		expiry: expiry,
	}
}

func (s *Service) Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	admin, err := s.getAdminByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.generateToken(admin)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &LoginResponse{
		Token: token,
		Admin: ToAdminResponse(admin),
	}, nil
}

func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func (s *Service) GetAdminByID(ctx context.Context, id int64) (*Admin, error) {
	return s.getAdminByID(ctx, id)
}

func (s *Service) generateToken(admin *Admin) (string, error) {
	claims := &Claims{
		UserID: admin.ID,
		Email:  admin.Email,
		Name:   admin.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s *Service) getAdminByEmail(ctx context.Context, email string) (*Admin, error) {
	var a Admin
	err := s.db.QueryRow(ctx,
		"SELECT id, email, password_hash, name, created_at FROM admins WHERE email = $1",
		email,
	).Scan(&a.ID, &a.Email, &a.PasswordHash, &a.Name, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *Service) getAdminByID(ctx context.Context, id int64) (*Admin, error) {
	var a Admin
	err := s.db.QueryRow(ctx,
		"SELECT id, email, password_hash, name, created_at FROM admins WHERE id = $1",
		id,
	).Scan(&a.ID, &a.Email, &a.PasswordHash, &a.Name, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *Service) SeedAdmin(ctx context.Context, email, password, name string) error {
	var exists bool
	err := s.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM admins WHERE email = $1)", email).Scan(&exists)
	if err != nil {
		return fmt.Errorf("check admin: %w", err)
	}
	if exists {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	_, err = s.db.Exec(ctx,
		"INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)",
		email, string(hash), name,
	)
	if err != nil {
		return fmt.Errorf("insert admin: %w", err)
	}

	return nil
}

func (s *Service) UpdateProfile(ctx context.Context, id int64, name string) error {
	_, err := s.db.Exec(ctx, "UPDATE admins SET name = $1 WHERE id = $2", name, id)
	return err
}

func (s *Service) ChangePassword(ctx context.Context, id int64, current, newPass string) error {
	admin, err := s.getAdminByID(ctx, id)
	if err != nil {
		return ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(current)); err != nil {
		return ErrInvalidCredentials
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPass), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	_, err = s.db.Exec(ctx, "UPDATE admins SET password_hash = $1 WHERE id = $2", string(hash), id)
	return err
}
