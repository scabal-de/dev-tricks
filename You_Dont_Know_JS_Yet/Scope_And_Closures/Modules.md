#Modules

A module is a collection of related data and functions (often referred to as methods in this context), characterized by a
division between hidden private details and public accessible details, usually called the “public API.”
A module is also stateful: it maintains some information over time, along with functionality to access and update that
information.

To embody the full spirit of the module pattern, we not only need grouping and state, but also access control through
visibility (private vs. public).

##Modules (Stateful Access Control)

To embody the full spirit of the module pattern, we not only need grouping and state, but also access control through
visibility (private vs. public).

```
var Student = (function defineStudent(){

  var records = [
    { id: 14, name: "Kyle", grade: 86 },
    { id: 73, name: "Suzy", grade: 87 },
    { id: 112, name: "Frank", grade: 75 },
    { id: 6, name: "Sarah", grade: 91 }
  ];

  var publicAPI = {
    getName
  };

  return publicAPI;

  // ************************

  function getName(studentID) {
    var student = records.find(
      student => student.id == studentID
    );

    return student.name;

  }
})();

Student.getName(73); // Suzy
```

Student is now an instance of a module. It features a public API with a single method: getName(..). This method is able
to access the private hidden records data.

###How does the classic module format work?

Notice that the instance of the module is created by the defineStudent() IIFE being executed. This IIFE returns an
object (named publicAPI) that has a property on it referencing the inner getName(..) function.

From the outside, Student.getName(..) invokes this exposed inner function, which maintains access to the inner
records variable via closure.

####So to clarify what makes something a classic module:

    • There must be an outer scope, typically from a module factory function running at least once.

    • The module’s inner scope must have at least one piece of hidden information that represents state for the module.

    • The module must return on its public API a reference to at least one function that has closure over the hidden
        module state (so that this state is actually preserved).
