package utils

import (
	"crypto/sha512"
	"fmt"
	"io"
)

//Sha512EmptyHash... Create new unique hash from message
func Sha512EmptyHash(message string) string {
	h := sha512.New()
	io.WriteString(h, message)
	return fmt.Sprintf("%x", h.Sum(nil))
}
