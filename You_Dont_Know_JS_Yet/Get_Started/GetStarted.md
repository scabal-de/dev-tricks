# JS Fundamentals

In JS, each standalone file is its own separate program and the reason this matters is primarily around error handling.

- Since JS treats files as programs, one file may fail (during parse/compile or execution) and that will not necessarily prevent the next file from being processed.
- _Many projects use build process tools that end up combining separate files from the project into a single file to be delivered to a web page. When this happens, JS treats this single combined file as the entire program._
- The only way multiple standalone .js files act as a single program is by sharing their state (and access to their public functionality) via the “global scope.”
- If a file is loaded via module-loading mechanism such as an import statement or a `<script type=module>` tag, all its code is treated as a single module.

## Values

Values are data, they're how the program maintains state and they come in two forms in JS: **primitive** and **object**.

- Primitive: strings, booleans, numbers, symbols, null and undefined.
- Object: Arrays and Objects

## Value Type Determination

For distinguishing values, the typeof operator tells you its built-in type, if primitive, or "object" otherwise:

```jsx
typeof 42; // "number"
typeof "abc"; // "string"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof null; // "null"
typeof { a: 1 }; // "object"
typeof [1, 2, 3]; // "object"
typeof function hello() {}; // "function"
```

## Declaring and Using Variables

- `let` allows a more limited access to the variable than `var`. This is called “block scoping” (useful for limiting how widespread variable declarations are in our programs, helping to prevent accidental overlap of their names) as opposed to regular or function scoping.

  ```jsx
  var adult = true;
  if (adult) {
    var name = "Kyle";
    let age = 39;
    console.log("Shhh, this is a secret!");
  }
  console.log(name);
  // Kyle
  console.log(age);
  // Error!
  ```

- `const` it’s like `let` but has an additional limitation that it must be given a value at the moment it’s declared, and cannot be re-assigned a different value later.

  ```jsx
  const myBirthday = true;
  let age = 39;
  if (myBirthday) {
    age = age + 1; //OK!
    myBirthday = false; // Error!
  }
  ```

- There are other syntactic forms that declare identifiers (variables) in various scopes. In the following example the identifier hello is created in the outer scope, and it’s also automatically associated so that it references the function. But the named parameter name is created only inside the function, and thus is only accessible inside that function’s scope. hello and name generally behave as var-declared.

  ```jsx
  function hello(name) {
    console.log(`Hello, ${name}.`);
  }
  hello("Kyle"); // Hello, Kyle.
  ```

- Another syntax that declares a variable is a catch clause. The err is a block-scoped variable that exists only inside the catch clause, as if it had been declared with let.
  ```jsx
  try {
    someError();
  } catch (err) {
    console.log(err);
  }
  ```

## Functions

In JS, we should consider “function” to take the broader meaning of another related term: “procedure.” A procedure is a collection of statements that can be invoked one or more times, may be provided some inputs, and may give back one or more outputs.

- Functions are values that can be assigned and passed around.
- A function declaration statement, a function expression can be defined and assigned like this:
  ```jsx
  // let awesomeFunction = ..
  // const awesomeFunction = ..
  var awesomeFunction = function (coolThings) {
    // ..
    return amazingStuff;
  };
  ```

## Equality and Equivalence Comparison

- "Triple-equals" | `===` | "strict equality" operator, compares the value and the type of value. Meanwhile the "double equal" | `==` | "loose equality" only compares the value, cause this second one allows type conversion..

  ```jsx
  3 === 3.0; // true
  "yes" === "yes"; // true
  null === null; // true
  false === false; // true
  42 === "42"; // false
  "hello" === "Hello"; // false
  true === 1; // false
  0 === null; // false
  "" === null; // false
  null === undefined; // false
  ```

## Coercive Comparisons

Coercion means a value of one type being converted to its respective representation in another type (to whatever extent possible).

```jsx
var x = "10";
var y = "9";
x < y; // true, watch out!
```

## JS Organization

Two major patterns for organizing code (data and behavior) are: **Classes** and **Modules.**

- Both patterns can be use at the same time, stick just with one or even neither.

## Object Oriented

### Class

A class in a program is a definition of a "type" of custom data structure that includes both data and behaviors that operate on the data.

### Class Inheritance

Inheritance is a powerful tool for organizing data/behavior in separate logical units (classes), but allowing the child class to cooperate with the parent by accessing/using its behavior and data.

- Use the extends clause to extend the general definition of a `Publication` to include additional behavior.
- The `super(..)` call in each constructor delegates to the parent `Publication` class’s constructor for its initialization work.
- The fact that both the inherited and overridden methods can have the same name and co-exist is called _polymorphism_.

```jsx
class Publication {
  constructor(title, author, pubDate) {
    this.title = title;
    this.author = author;
    this.pubDate = pubDate;
  }
  print() {
    console.log(`Title: ${this.title} By: ${this.author} ${this.pubDate}`);
  }
}
// here is the class inheritance
class Book extends Publication {
  constructor(bookDetails) {
    super(bookDetails.title, bookDetails.author, bookDetails.publishedOn);
    this.publisher = bookDetails.publisher;
    this.ISBN = bookDetails.ISBN;
  }
  print() {
    super.print();
    console.log(`Publisher: ${this.publisher} ISBN: ${this.ISBN}`);
  }
}
var YDKJS = new Book({
  title: "You Don't Know JS",
  author: "Kyle Simpson",
  publishedOn: "June 2014",
  publisher: "O'Reilly",
  ISBN: "123456-789",
});
YDKJS.print();
// Title: You Don't Know JS
// By: Kyle Simpson
// June 2014
// Publisher: O'Reilly
// ISBN: 123456-789
```

## Modules

Has essentially the same goal as the class pattern, which is to group data and behavior together into logical units.

### Classic Modules

_Classic modules_ are an outer function which returns an "instance" of the module with one or more functions exposed that can operate on the modules instance's internal (hidden) data.

- The class form stores methods and data on an object instance, which must be accessed with the `this.`prefix. With modules, the methods and data are accessed as identifier variable in score, without any `this.`prefix.

```jsx
function Publication(title, author, pubDate) {
  var publicAPI = {
    print() {
      console.log(`Title: ${title} By: ${author} ${pubDate}`);
    },
  };
  return publicAPI;
}
function Book(bookDetails) {
  var pub = Publication(
    bookDetails.title,
    bookDetails.author,
    bookDetails.publishedOn
  );
  var publicAPI = {
    print() {
      pub.print();
      console.log(
        `Publisher: ${bookDetails.publisher} ISBN: ${bookDetails.ISBN}`
      );
    },
  };
  return publicAPI;
}
var YDKJS = Book({
  title: "You Don't Know JS",
  author: "Kyle Simpson",
  publishedOn: "June 2014",
  publisher: "O'Reilly",
  ISBN: "123456-789",
});
YDKJS.print();
// Title: You Don't Know JS
// By: Kyle Simpson
// June 2014
// Publisher: O'Reilly
// ISBN: 123456-789
```

### ES Modules

- Introduced to the JS language in ES6
- There's no wrapping function to define a module. The wrapping context is a file.
- You don’t interact with a module’s “API” explicitly, but rather use the `export` keyword to add a variable or method to its public API definition.
- You don’t “instantiate” an ES module, you just import it to use its single instance.
- If your module needs to support multiple instantiations, you have to provide a classic module-style factory function on your ESM definition for that purpose.

```jsx
function printDetails(title, author, pubDate) {
  console.log(`Title: ${title} By: ${author} ${pubDate}`);
}
export function create(title, author, pubDate) {
  var publicAPI = {
    print() {
      printDetails(title, author, pubDate);
    },
  };
  return publicAPI;
}
```

```jsx
import { create as createPub } from "publication.js";
function printDetails(pub, URL) {
  pub.print();
  console.log(URL);
}
export function create(title, author, pubDate, URL) {
  var pub = createPub(title, author, pubDate);
  var publicAPI = {
    print() {
      printDetails(pub, URL);
    },
  };
  return publicAPI;
}
```

```jsx
import { create as newBlogPost } from "blogpost.js";
var forAgainstLet = newBlogPost(
  "For and against let",
  "Kyle Simpson",
  "October 27, 2014",
  "https://davidwalsh.name/for-and-against-let"
);
forAgainstLet.print();
// Title: For and against let
// By: Kyle Simpson
// October 27, 2014
// https://davidwalsh.name/for-and-against-let
```

# Iteration

The importance of the iterator pattern in in adhering to a standard way of processing data iteratively, which creates cleaner and easier to understand code.

- ES6 standardized a specific protocol for the iterator pattern directly in the language by defining a `next()` method whose return an object called an _iterator result;_ the object has `value` and `done`properties, where done is a boolean that is `false` until the iteration over the underlying data source is complete.

## Consuming Iterators

ES6 Iteration protocol allows to consume a data source one value at a time, after checking each `next()` call for done to be `true` to stop the iteration

```jsx
// given an iterator of some data source
var it = /* ... */;
// loop over its results one at a time
for (let val of it) {
	console.log(`Iterator value: ${val}`)
}
// Iterator value: ..
// Iterator value: ..
```

## `...` Operator

- The _spread_ form is an iterator-consumer.
- This operator has two symmetrical forms: _spread_ and _rest_ (or _gather)._
- To spread an iterator, you need to have _something_ to spread it into, such as an array or an argument list for a function call.
- Both next examples, the iterator-spread form of `...` follows the iterator-consumption protocol to retrieve all available values from an iterator and place them into the receiving context.

```jsx
// spread an iterator into an array,
// with each iterated value occupying
// an array element position.
var vals = [...it];
// spread an iterator into a function,
// call with each iterated value
// occupying an argument position.
doSomethingUseful(...it);
```

## Iterables

An iterable is a value that can be iterated over.

- The protocol automatically creates an iterator instance from an iterable, and consumes just that iterator instance to is completion.
- All built-in iterables in JS have three iterator forms : keys-only (`keys()`), values-only (`values()`) and entries (`entries()`)
- ES6 defined the basic data structure/collection types in JS as iterables;

  - Strings, arrays, maps, sets

  ```jsx
  // an array is an iterable
  var arr = [10, 20, 30];
  for (let val of arr) {
    console.log(`Array value: ${val}`);
  }
  // Array value: 10
  // Array value: 20
  // Array value: 30
  ```

- Arrays are iterables, so you can shallow-copy an array by: `var arrCopy = [ ...ar];`
- You can also iterate the characters in a string:

  ```jsx
  var greeting = "Hello world!";
  var chars = [...greeting];
  chars;
  // [ "H", "e", "l", "l", "o", " ",
  //   "w", "o", "r", "l", "d", "!" ]
  ```

- Maps have a different default iteration. In its iteration is not just over the map's values but instead its `entries`. An `entry` is a tuple (2-element array) including both a key and a value.

  ```jsx
  // given two DOM elements, `btn1` and `btn2`
  var buttonNames = new Map();
  buttonNames.set(btn1, "Button 1");
  buttonNames.set(btn2, "Button 2");
  for (let [btn, btnName] of buttonNames) {
    btn.addEventListener("click", function onClick() {
      console.log(`Clicked ${btnName}`);
    });
  }
  // for getting their values
  for (let btnName of buttonNames.values()) {
    console.log(btnName);
  }
  // Button 1
  // Button 2
  // for getting its value and index
  var arr = [10, 20, 30];
  for (let [idx, val] of arr.entries()) {
    console.log(`[${idx}]: ${val}`);
  }
  // [0]: 10
  // [1]: 20
  // [2]: 30
  ```

# Closure

A closure is when a function remembers and continues to access variables form outside its scope, even the function is executed in a different scope.

- Closure is part of the nature of a function.
- Objects don't get closures, functions do.
- You must execute a function in a different scope than where that function was originally defined in order to observe a closure.

```jsx
function greeting(msg) {
  return function who(name) {
    console.log(`${msg}, ${name}!`);
  };
}
var hello = greeting("Hello");
var howdy = greeting("Howdy");
hello("Kyle");
// Hello, Kyle!
hello("Sarah");
// Hello, Sarah!
howdy("Grant");
// Howdy, Grant!
function counter(step = 1) {
  var count = 0;
  return function increaseCount() {
    count = count + step;
    return count;
  };
}
var incBy1 = counter(1);
var incBy3 = counter(3);
incBy1(); //1
incBy1(); //2
incBy3(); //3
incBy3(); //6
incBy3(); //9
```

# `this` Keyword

`this` is not a fixed characteristic of a function based on the function’s definition, but rather a dynamic characteristic that’s determined each time the function is called.

- It's not a reference to the function itself and it's not pointing to the instance that a method belongs to.
- When a function is defined, it is attached to its enclosing scope via closure. But functions also have another characteristic besides their scope that influences what they can access. This characteristic is best described as an _execution context_, and it’s exposed to the function via its `this` keyword.
- The execution context is like a tangible object whose properties are made available to a function while it executes.

  ```jsx
  function classroom(teacher) {
    return function study() {
      console.log(`${teacher} says to study ${this.topic}`);
    };
  }
  var assignment = classroom("Kyle"); // this undefined
  var homework = {
    topic: "JS",
    assignment: assignment,
  };
  homework.assignment();
  // Kyle says to study JS
  var otherHomework = { topic: "Math" };
  assignment.call(otherHomework);
  // Kyle says to study Math
  ```

# Prototypes

Where `this` is a characteristic of function execution, a prototype is a characteristic of an object, and specifically resolution of a property access.

- A hidden behind the scenes linkage between two objects. This linkage occurs when an object is created; it’s linked to another object that already exists.
- Prototype chain: a series of objects linked together via prototypes.
- The purpose of this prototype linkage (i.e., from an object B to another object A) is so that accesses against B for properties/methods that B does not have, are delegated to A to handle.

  ```jsx
  var homework = { topic: "JS" };
  /* 
  	The homework object only has a single property on it: topic. 
  	However, its default prototype linkage connects to the Object.prototype object, 
  	which has common built-in methods on it like toString() and valueOf(), among others.
  */
  ```

## Object Linkage

- Create by the `Object.create(...)` utility.

```jsx
var homework = { topic: "JS" };
var otherHomework = Object.create(homework);
otherHomework.topic; // "JS"
homework.topic; // "JS"
otherHomework.topic; // "JS"
otherHomework.topic = "Math";
otherHomework.topic; // "Math"
homework.topic; // "JS" -- not "Math"
```
