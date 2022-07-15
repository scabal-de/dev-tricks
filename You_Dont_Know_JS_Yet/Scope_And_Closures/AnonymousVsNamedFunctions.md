#Anonymous vs. Named Functions

functions can be expressed either in named or anonymous form. It’s vastly more common to use the anonymous form, but is that a good idea?

As you contemplate naming your functions, consider:

    • Name inference is incomplete
    • Lexical names allow self-reference
    • Names are useful descriptions
    • Arrow functions have no lexical names
    • IIFEs also need names

Without a lexical name identifier, the function has no internal way to refer to itself. Self-reference is important for things like
recursion and event handling:

```
// broken
runOperation(function(num){
  if (num <= 1) return 1;
  return num * oopsNoNameToCall(num - 1);
});
// also broken
btn.addEventListener("click",function(){
  console.log("should only respond to one click!");
  btn.removeEventListener("click",oopsNoNameHere);
});
```

Leaving off the lexical name from your callback makes it
harder to reliably self-reference the function. You could declare a variable in an enclosing scope that references the
function, but this variable is controlled by that enclosing scope—it could be re-assigned, etc.—so it’s not as reliable as
the function having its own internal self-reference.

##Names are Descriptors

Leaving off a name from a function makes it harder for the reader to tell what the function’s purpose is,
at a quick glance. They have to read more of the code, including the code inside the function, and
the surrounding code outside the function, to figure it out.

Consider:

```
[ 1, 2, 3, 4, 5 ].filter(function(v){
  return v % 2 == 1;
});
// [ 1, 3, 5 ]
[ 1, 2, 3, 4, 5 ].filter(function keepOnlyOdds(v){
  return v % 2 == 1;
});
// [ 1, 3, 5 ]
```

There’s just no reasonable argument to be made that omitting the name keepOnlyOdds from the first callback
more effectively communicates to the reader the purpose of this callback. You saved 13 characters, but lost important readability
information. The name keepOnlyOdds very clearly tells the reader, at a quick first glance, what’s happening.
