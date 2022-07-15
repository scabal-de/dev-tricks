#Closures

Closure is observed when a function uses variable(s) from outer scope(s) even while running
in a scope where those variable(s) wouldn’t be accessible.

The key parts of this definition are:

    • Must be a function involved
    • Must reference at least one variable from an outer scope
    • Must be invoked in a different branch of the scope chain from the variable(s)

Closure is a behavior of functions and only functions. If you aren’t dealing with a function, closure does not apply. An object cannot have closure, nor does a class have closure (though its functions/methods might). Only functions have closure.

For closure to be observed, a function must be invoked, and specifically it must be invoked in a different branch
of the scope chain from where it was originally defined. A function executing in the same scope it was defined would
not exhibit any observably different behavior with or without closure being possible; by the observational perspective and
definition, that is not closure.

example:

```
function lookupStudent(studentID) {
  var students = [
  { id: 14, name: "Kyle" },
  { id: 73, name: "Suzy" },
  { id: 112, name: "Frank" },
  { id: 6, name: "Sarah" }
  ];
  return function greetStudent(greeting){

    var student = students.find(
      student => student.id == studentID
    );
    return `${ greeting }, ${ student.name }!`;
  };
}

var chosenStudents = [
  lookupStudent(6),
  lookupStudent(112)
];

// accessing the function's name:
chosenStudents[0].name;
// greetStudent
chosenStudents[0]("Hello");
// Hello, Sarah!
chosenStudents[1]("Howdy");
// Howdy, Frank!
```

closure is associated with an instance of a function, rather than its single
lexical definition.

```
function lookupStudent(studentID) {
  return function nobody(){
    var msg = "Nobody's here yet.";
    console.log(msg);
  };
}

var student = lookupStudent(112);
student();
// Nobody's here yet.
```

The inner function nobody() doesn’t close over any outer variables—it only uses its own variable msg. Even though
studentID is present in the enclosing scope, studentID is not referred to by nobody(). The JS engine doesn’t need
to keep studentID around after lookupStudent(..) has finished running, so GC wants to clean up that memory.

Models for mentally tackling closure:

    • Observational: closure is a function instance remembering its outer variables even as that
      function is passed to and invoked in other scopes.

    • Implementational: closure is a function instance and its scope environment preserved
      in-place while any references to it are passed around and invoked from other scopes.

Benefits:

    • Closure can improve efficiency by allowing a function instance to remember previously determined information instead of having to compute it each time.

    • Closure can improve code readability, bounding scopeexposure by encapsulating variable(s) inside function instances, while still making
      sure the information in those variables is accessible for future use. The resultant narrower, more specialized function instances are
      cleaner to interact with, since the preserved information doesn’t need to be passed in every invocation.
