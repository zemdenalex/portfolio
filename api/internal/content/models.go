package content

import "errors"

var (
	ErrNotFound    = errors.New("content not found")
	ErrKeyRequired = errors.New("key is required")
)

type SiteContent struct {
	ID      string `json:"id"`
	Key     string `json:"key"`
	ValueEn string `json:"value_en"`
	ValueRu string `json:"value_ru"`
}

type CreateRequest struct {
	Key     string `json:"key"`
	ValueEn string `json:"value_en"`
	ValueRu string `json:"value_ru"`
}

func (r *CreateRequest) Validate() error {
	if r.Key == "" {
		return ErrKeyRequired
	}
	return nil
}

type UpdateRequest struct {
	ValueEn string `json:"value_en"`
	ValueRu string `json:"value_ru"`
}
