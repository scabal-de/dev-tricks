#Hoisting

Consider:

```
greeting();
// Hello!

function greeting() {
  console.log("Hello!");
}
```

why can you access the identifier greeting from line 1 (to retrieve and execute a function reference), even
though the greeting() function declaration doesn’t occur until line 4?

every identifier is created at the beginning of the scope it belongs to, every time that scope is entered.

The term most commonly used for a variable being visible from the beginning of its enclosing scope, even though its
declaration may appear further down in the scope, is called hoisting.

Also, we must know that the functions has an special characteristic called "Function hoisting".

    When a function declaration’s name identifier is registered at the top of its scope, it’s additionally auto-initialized to that
    function’s reference. That’s why the function can be called throughout the entire scope.
