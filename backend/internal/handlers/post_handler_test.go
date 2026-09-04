package handlers

import (
	"context"
	"errors"
	"testing"
)

type mediaRepoStub struct {
	moved []string
	err   error
}

func (s *mediaRepoStub) GenerateUploadURL(string, string) (string, string, error) {
	return "", "", nil
}

func (s *mediaRepoStub) MoveMediaFromTmpToPosts(_ context.Context, fileName string) error {
	s.moved = append(s.moved, fileName)
	return s.err
}

func TestFinalizeMedia(t *testing.T) {
	repo := &mediaRepoStub{}
	handler := &PostHandler{mediaRepo: repo}

	err := handler.finalizeMedia(context.Background(), []string{
		"https://storage.googleapis.com/bucket/post/photo-one.jpg",
		"https://storage.googleapis.com/bucket/post/photo-two.jpg",
	})
	if err != nil {
		t.Fatalf("finalizeMedia returned an error: %v", err)
	}

	if len(repo.moved) != 2 || repo.moved[0] != "photo-one.jpg" || repo.moved[1] != "photo-two.jpg" {
		t.Fatalf("moved files = %#v", repo.moved)
	}
}

func TestFinalizeMediaReturnsInvalidURLError(t *testing.T) {
	repo := &mediaRepoStub{}
	handler := &PostHandler{mediaRepo: repo}

	err := handler.finalizeMedia(context.Background(), []string{"https://storage.googleapis.com/bucket/post/no-extension"})
	if err == nil {
		t.Fatal("finalizeMedia succeeded for an invalid URL")
	}
	if repo.moved != nil {
		t.Fatalf("moved files = %#v, want no moves", repo.moved)
	}
}

func TestFinalizeMediaReturnsMoveError(t *testing.T) {
	expectedErr := errors.New("storage unavailable")
	repo := &mediaRepoStub{err: expectedErr}
	handler := &PostHandler{mediaRepo: repo}

	err := handler.finalizeMedia(context.Background(), []string{
		"https://storage.googleapis.com/bucket/post/photo.jpg",
	})
	if err == nil || !errors.Is(err, expectedErr) {
		t.Fatalf("finalizeMedia error = %v, want wrapped storage error", err)
	}
}
