package leads

import "testing"

func TestSubmitRequest_Validate(t *testing.T) {
	cases := []struct {
		name    string
		req     SubmitRequest
		wantErr bool
	}{
		{"valid ascii", SubmitRequest{Name: "Test", Email: "a@b.com"}, false},
		{"valid cyrillic", SubmitRequest{Name: "Test", Email: "вася@yandex.ru"}, false},
		{"valid short", SubmitRequest{Name: "Test", Email: "a@b.c"}, false},
		{"missing name", SubmitRequest{Name: "", Email: "a@b.com"}, true},
		{"missing email", SubmitRequest{Name: "Test", Email: ""}, true},
		{"missing at sign", SubmitRequest{Name: "Test", Email: "noatsign"}, true},
		{"oversize", SubmitRequest{Name: "Test", Email: string(make([]byte, 250)) + "@b.com"}, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.req.Validate()
			if (err != nil) != tc.wantErr {
				t.Fatalf("Validate() err=%v, wantErr=%v", err, tc.wantErr)
			}
		})
	}
}
