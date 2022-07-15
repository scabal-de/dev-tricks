#Browser “Window”

Consider this .js file:

```
var studentName = "Kyle";

function hello() {
  console.log(`Hello, ${ studentName }!`);
}

hello();
// Hello, Kyle!
```

This code may be loaded in a web page environment using an inline script tag, a script src=.. script tag in the markup,
or even a dynamically created script DOM element. In all three cases, the studentName and hello
identifiers are declared in the global scope.
