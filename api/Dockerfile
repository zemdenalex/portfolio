FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /admin-reset ./cmd/admin-reset

FROM alpine:3.20
RUN apk add --no-cache ca-certificates chromium
COPY --from=builder /api /api
COPY --from=builder /admin-reset /admin-reset
COPY --from=builder /app/migrations /migrations
ENV CHROME_PATH=/usr/bin/chromium-browser
EXPOSE 8080
CMD ["/api"]
