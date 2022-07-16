# Chapter 7. WebAssembly

## Your First WebAssembly

While WebAssembly is a binary format, a plain text format
exists to represent it in human readable form. This is
comparable to how machine code can by represented in a
human-readable assembly language. The language for this
WebAssembly text format is simply called WebAssembly
text format, but the file extension typically used is .wat, so
it’s common enough to refer to this language as WAT. It
uses S-expressions as its primary syntactic separator,
which is helpful for both parsing and readability. Sexpressions, known primarily from the Lisp family of
languages, are nested lists delimited by parentheses, with
whitespace between each item in the list.

To get a feel for this format, let’s implement a simple
addition function in WAT. Create a file called ch7-wasmadd/add.wat and add the content below

**Example: ch7-wasm-add/add.wat**

```jsx
(module//1
 (func $add (param $a i32) (param $b i32) (result i32)//2
 local.get $a//3
 local.get $b
 i32.add)
 (export "add" (func $add)) //4
)
```

1.- The first line declares a module. Every WAT file begins
with this.

2.- We declare a function called $add, taking in two 32-bit
integers and returning another 32-bit integer.

3.- This is the start of the function body, in which we have
three statements. The first two grab the function
parameters and put them on the stack one after another.
Recall that WebAssembly is stack-based. That means
many operations will operate on the first (if unary) or
first two (if binary) items on the stack. The third
statement is a binary “add” operation on i32 values, so it
grabs the top two values from the stack and adds them
together, putting the result at the top of the stack. The
return value for a function is the value at the top of the
stack once it completes.

4.- In order to use a function outside the module in the host
environment, it needs to be exported. Here we export
the $add function, giving it the external name add.

We can convert this WAT file to WebAssembly binary by
using the wat2wasm tool from the WebAssembly Binary
Toolkit (WABT). This can be done with the following oneliner in the ch7-wasm-add directory

```
$ npx -p wabt wat2wasm add.wat -o add.wasm
```

Now we have our first WebAssembly file! These files aren’t
useful outside a host environment, so let’s write a bit of
JavaScript to load the WebAssembly and test the add
function.

**Example: ch7-wasm-add/add.js**

```jsx
const fs = require("fs/promises"); // Needs Node.js v14 or higher.
(async () => {
  const wasm = await fs.readFile("./add.wasm");
  const {
    instance: {
      exports: { add },
    },
  } = await WebAssembly.instantiate(wasm);
  console.log(add(2, 3));
})();
```

Provided you’ve created the .wasm file using the preceding
wat2wasm command, you should be able to run this in the
ch7-wasm-add directory.

```
$ node add.js
```

You can verify from the output that we are, in fact, adding
via our WebAssembly module.

Simple mathematical operations on the stack don’t make
any use of linear memory or of concepts that have no
meaning in WebAssembly, such as strings.

## Atomic Operations in WebAssembly

WebAssembly instructions often start with the type. In the
case of atomic operations, the type is always i32 or i64,
corresponding to 32-bit and 64-bit integers, respectively.
All atomic operations have .atomic. next in the instruction
name. After that, you’ll find the specific instruction name.

An example of an atomic operations could be like that:

```
[i32|i64].atomic.[load|load8_u|load16_u|load32_u]
```

The load family of instructions is equivalent to
Atomics.load() in JavaScript. Using one of the suffixed
instructions allows you to load smaller numbers of bits,
extending the result with zeros.

```
[i32|i64].atomic.[store|store8|store16|store32]
```

The store family of instructions is equivalent to
Atomics.store() in JavaScript. Using one of the
suffixed instructions wraps the input value to that
number of bits and stores those at the index.

```
[i32|i64].atomic.[rmw|rmw8|rmw16|rmw32].
[add|sub|and|or|xor|xchg|cmpxchg][|_u]
```

The rmw family of instructions all perform read-modifywrite operations, equivalent to add(), sub(), and(),
or(), xor(), exchange(), and compareExchange() from
the Atomics object in JavaScript, respectively. The
operations are suffixed with a \_u when they zero-extend,
and rmw can have a suffix corresponding to the number
of bits to be read.

The next two operations have a slightly different naming
convention:

```
memory.atomic.[wait32|wait64]
```

These are equivalent to Atomics.wait() in JavaScript,
suffixed according to the number of bits they operate on.

```
memory.atomic.notify
```

This is equivalent to Atomics.notify() in JavaScript.

These instructions are enough to perform the same atomic
operations in WebAssembly as we can in JavaScript, but
there is an additional operation not available in JavaScript:

### atomic.fence

This instruction takes no arguments and doesn’t return
anything. It’s intended to be used by higher-level
languages that have ways of guaranteeing ordering of
nonatomic accesses to shared memory.

## AssemblyScript

AssemblyScript is a subset of TypeScript that compiles to
WebAssembly. Rather than compiling an existing langauge
and providing implementations of existing system APIs,
AssemblyScript was designed as a way to produce
WebAssembly code with a much more familiar syntax than
WAT

An AssemblyScript module looks a lot like a TypeScript
module. If you’re unfamiliar with TypeScript, it can be
thought of as ordinary JavaScript, but with some additional
syntax to indicate type information. Here is a basic
TypeScript module that performs addition:

```jsx
export function add(a: number, b: number): number {
  return a + b;
}
```

AssemblyScript looks much the same, except instead of
using JavaScript’s number type, there are built-in types for
each of the WebAssembly types. If we wanted to write the
same addition module in TypeScript, and assuming 32-bit
integers everywhere for types

**Example: ch7-wasm-add/add.ts**

```jsx
export function add(a: i32, b: i32): i32 {
  return a + b;
}
```

Since AssemblyScript files are just TypeScript, they use the
.ts extension just the same. To compile a given
AssemblyScript file to WebAssembly, we can use the asc
command from the assemblyscript module. Try running
the following command in the ch7-wasm-add directory:

```
$ npx -p assemblyscript asc add.ts --binaryFile add.wasm
```

If you omit the --binaryFile add.wasm you’ll get the
module as translated into WAT, as shown below

**Example: The WAT rendition of the AssemblyScript add function**

```jsx
(module
(type $i32_i32_=>_i32 (func (param i32 i32) (result i32)))
(memory $0 0)
(export "add" (func $add/add))
(export "memory" (memory $0))
(func $add/add (param $0 i32) (param $1 i32) (result i32)
 local.get $0
 local.get $1
 i32.add
)
)
```

AssemblyScript doesn’t provide the ability to spawn
threads, but threads can be spawned in the JavaScript
environment, and SharedArrayBuffers can be used for the
WebAssembly memory.

Most importantly, it supports atomic
operations via a global atomics object, not particularly
different from regular JavaScript’s Atomics. The main
difference is that rather than operating on a TypedArray,
these functions operate on the linear memory of the
WebAssembly module, with a pointer and an optional offset.
See the AssemblyScript documentation for details.
