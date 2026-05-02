package quiz

import "testing"

func TestPickWinner(t *testing.T) {
	cases := []struct {
		name   string
		scores map[string]int
		want   string
	}{
		{"single winner", map[string]int{"minimalist": 5}, "minimalist"},
		{"clear winner", map[string]int{"minimalist": 5, "bold-modern": 2}, "minimalist"},
		{"alphabetical tie-break", map[string]int{"minimalist": 3, "bold-modern": 3}, "bold-modern"},
		{"three-way tie", map[string]int{"c": 1, "a": 1, "b": 1}, "a"},
		{"negative scores ignored by argmax", map[string]int{"minimalist": 5, "bold-modern": -1}, "minimalist"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := pickWinner(tc.scores)
			if got != tc.want {
				t.Fatalf("pickWinner(%v) = %q, want %q", tc.scores, got, tc.want)
			}
		})
	}
}
