package main

import (
	"syscall/js"
)

func hello(this js.Value, inputs []js.Value) interface{} {
	return "Hello"
}

func main() {
	js.Global().Set("hello", js.FuncOf(hello))
	<-make(chan bool)
}
