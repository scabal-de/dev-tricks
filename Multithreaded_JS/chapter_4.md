# Chapter 4: Shared Memory

the Atomics object and the SharedArrayBuffer class allows you to share memory between two threads without depending on message passing.

Note:
In the wrong hands, the tools covered here can be dangerous, introducing logic-defying bugs to your application that slither in the shadows during development only to rear their
heads in production

## Intro to Shared Memory

For this example you will build a very basic application that is able to communicate
between two web workers.

### Shared Memory in the Browser

To get started, create another directory to house this project in named ch4-web-workers/.
Then, create an HTML file named index.html, and add the content below to the

**Example: ch4-web-workers/index.html**

```html
<html>
  <head>
    <title>Shared Memory Hello World</title>
    <script src="main.js"></script>
  </head>
</html>
```

Once you’re done with that file you’re ready for the more complicated part of the
application. Create a file named main.js containing the content below

**Example: ch4-web-workers/main.js**

```jsx
if (!crossOriginIsolated) {
  //1
  throw new Error("Cannot use SharedArrayBuffer");
}
const worker = new Worker("worker.js");
const buffer = new SharedArrayBuffer(1024); //2
const view = new Uint8Array(buffer); //3
console.log("now", view[0]);
worker.postMessage(buffer);
setTimeout(() => {
  console.log("later", view[0]);
  console.log("prop", buffer.foo); //4
}, 500);
```

1.- When crossOriginIsolated is true, then SharedArrayBuffer can be used.

2.- Instantiates a 1 KB buffer.

3.- A view into the buffer is created.

4.- A modified property is read.

This file is similar to one that you created before. In fact, it’s still making use of a
dedicated worker. But a few complexities have been added. The first new thing is the
check for the crossOriginIsolated value, which is a global variable available in modern
browsers. This value tells you if the JavaScript code currently being run is capable of,
among other things, instantiating a SharedArrayBuffer instance.

This file is similar to one that you created before. In fact, it’s still making use of a
dedicated worker. But a few complexities have been added. The first new thing is the
check for the crossOriginIsolated value, which is a global variable available in modern
browsers. This value tells you if the JavaScript code currently being run is capable of,
among other things, instantiating a SharedArrayBuffer instance.

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The test server that you’ll run automatically sets these headers. Any time you build a
production-ready application that uses SharedArrayBuffer instances you’ll need to
remember to set these headers.

After a dedicated worker is instantiated, an instance of a SharedArrayBuffer is also
instantiated. The argument that follows, 1,024 in this case, is the number of bytes
allocated to the buffer. Unlike other arrays or buffer objects you might be familiar with,
these buffers cannot shrink or grow in size after they’ve been created.

This view into the buffer allows us to read from it using the array index syntax. In this
case, we’re able to inspect the 0th byte in the buffer by logging a call to view[0]. After
that, the buffer instance is passed into the worker using the worker.postMessage()
method

Once the script is finished with the setup work, it schedules a function to run in 500 ms.
This script prints the 0th byte of the buffer again and also attempts to print a property
attached to the buffer named .foo. Note that this file otherwise does not have a
worker.onmessage handler defined.

Now that you’re finished with the main JavaScript file you’re ready to create the worker. Make a file named worker.js and add the content below

**Example: ch4-web-workers/worker.js**

```jsx
self.onmessage = ({ data: buffer }) => {
  buffer.foo = 42; //1
  const view = new Uint8Array(buffer);
  view[0] = 2; //2
  console.log("updated in worker");
};
```

1.- A property on the buffer object is written.

2.- The 0th index is set to the number 2.

This file attaches a handler for the onmessage event, which is run after the
.postMessage() method in main.js is fired. Once called, the buffer argument is grabbed.
The first thing that happens in the handler is that a .foo property is attached to the
SharedArrayBuffer instance. Next, another view is created for the buffer. After that the
buffer is updated through the view. Once that’s done, a message is printed so that you can
see what has happened.

Now you’re ready to run your new application.

```
$ npx MultithreadedJSBook/serve .
```

**Note:**
This is a very simple example that, while it works, is not how you would normally write multithreaded code.
There is no guarantee that the value updated in worker.js would be visible in main.js. For example, a clever
JavaScript engine could treat the value as a constant, though you’d be hard-pressed to find a browser where
this doesn’t happen.

## Shared Memory in Node.js

The Node.js equivalent of this application is mostly similar; however, the Worker global
provided by browsers isn’t available, and the worker thread won’t make use of
self.onmessage. Instead, the worker threads module must be required to gain access to
this functionality. Since Node.js isn’t a browser the index.html file isn’t applicable.

To create a Node.js equivalent, you’ll only need two files, which can be put in the same
ch4-web-workers/ folder you’ve been using. First, create a main-node.js script, and add
the content from Example 4-4 to it.

**Example:. ch4-web-workers/main-node.js**

```jsx
#!/usr/bin/env node
const { Worker } = require("worker_threads");
const worker = new Worker(__dirname + "/worker-node.js");
const buffer = new SharedArrayBuffer(1024);
const view = new Uint8Array(buffer);
console.log("now", view[0]);
worker.postMessage(buffer);
setTimeout(() => {
  console.log("later", view[0]);
  console.log("prop", buffer.foo);
  worker.unref();
}, 500);
```

The code is a little different, but it should feel mostly familiar. Because the Worker global
isn’t available, it is instead accessed by pulling the .Worker property from the required
worker_threads module. When instantiating the worker a more explicit path to the
worker must be provided than what is accepted by browsers. In this case the path
./worker-node.js was required, even though browsers are fine with just worker.js

Next, create a file named worker-node.js, which will contain the Node.js equivalent of the
browser worker.

**Example:. ch4-web-workers/worker-node.js**

```jsx
const { parentPort } = require("worker_threads");
parentPort.on("message", (buffer) => {
  buffer.foo = 42;
  const view = new Uint8Array(buffer);
  view[0] = 2;
  console.log("updated in worker");
});
```

In this case the self.onmessage value isn’t available to the worker. Instead, the
worker_threads module is required again, and the .parentPort property from the
module is used. This is used to represent a connection to the port from the calling
JavaScript environment.

The .onmessage handler can be assigned to the parentPort object, and the method
.on('message', cb) can be called. If using both, they’ll be called in the order that they
were used. The callback function for the message event receives the object being passed
in (buffer in this case) directly as an argument, while the onmessage handler provides a
MessageEvent instance with a .data property containing buffer.

Now that these files are complete, you can run them using this command:

```
$ node main-node.js
```

## SharedArrayBuffer and TypedArrays

Traditionally the JavaScript language didn’t really support interaction with binary data.
Sure, there were strings, but they really abstracted the underlying data storage
mechanism. There were also arrays, but those can contain values of any type and aren’t
appropriate for representing binary buffers.

The Node.js runtime is, among other things, capable of reading and writing to the
filesystem, streaming data to and from the network, and so on.

As the boundaries of the JavaScript language itself were pushed, so too grew the APIs and
the capabilities of the language to interact with the world outside of the browser window.
Eventually the ArrayBuffer object and later the SharedArrayBuffer object were created
and are now a core part of the language. Most likely, if Node.js were created today, it
would not have created its own Buffer implementation.

Instances of ArrayBuffer and SharedArrayBuffer represent a buffer of binary data that
is of fixed length and cannot be resized.

The sharedArrayBuffer focous on allows applications to share memory across
threads.

Just in case you haven’t had experience with it, binary is a system of counting that is 2
based, which at the lowest level is represented as 1s and 0s. Each of these numbers is
referred to as a bit. Decimal, the system humans mostly use for counting, is 10 based and
is represented with numerals from 0 to 9. A combination of 8 bits is referred to as a byte
and is often the smallest addressable value in memory since it’s usually easier to deal with
than individual bits. Basically, this means CPUs (and programmers) work with bytes
instead of individual bits.

These bytes are often represented as two hexadecimal characters, which is a 16 based
system of counting using the numerals 0–9 and the letters A–F. In fact, when you log an
instance of an ArrayBuffer using Node.js, the resulting output displays the value of the
buffer using hexadecimal.

ArrayBuffer and SharedArrayBuffer come with two properties. The first is the readonly value .byteLength, representing the byte length of the buffer, and the second is the
.slice(begin, end) method, which returns a copy of the buffer depending on the range
that is provided.

The begin value of .slice() is inclusive, while the end value is exclusive, and is notably
different than, say, String#substr(begin, length), where the second parameter is a
length. If the begin value is omitted, it defaults to the first element, and if the end value is
omitted, it defaults to the last element. Negative numbers represent values from the end
of the buffer.

Here’s an example of some basic interaction with an ArrayBuffer:

```jsx
const ab = new ArrayBuffer(8);
const view = new Uint8Array(ab);
for (i = 0; i < 8; i++) view[i] = i;
console.log(view);
// Uint8Array(8) [
// 0, 1, 2, 3,
// 4, 5, 6, 7
// ]
ab.byteLength; // 8
ab.slice(); // 0, 1, 2, 3, 4, 5, 6, 7
ab.slice(4, 6); // 4, 5
ab.slice(-3, -2); // 5
```

Different JavaScript environments display the contents of an ArrayBuffer instance
differently. Node.js displays a list of hexadecimal pairs as if the data were going to be
viewed as a Uint8Array.

The term view has been mentioned in a few places, and now is a good time to define it.
Due to the ambiguity of what binary data can mean, we need to use a view to read and
write to the underlying buffer. There are several of these views available in JavaScript.
Each of these views extends from a base class called TypedArray. This class can’t be
instantiated directly and isn’t available as a global, but it can be accessed by grabbing the
.prototype property from an instantiated child class.

JavaScript doesn’t have an integer data type, only its Number type, which is an
implementation of the IEEE 754 floating-point number. It is equivalent to the Float64
data type. Otherwise, any time a JavaScript Number is written to one of these views, some
sort of conversion process needs to happen.
When a value is written to Float64Array, it can be left mostly as the same. The minimum
allowed value is the same as Number.MIN_VALUE, while the maximum is
Number.MAX_VALUE. When a value is written to a Float32Array, not only are the minimum
and maximum value ranges reduced but the decimal precision will be truncated as well.
As an example of this, consider the following code:

```jsx
const buffer = new ArrayBuffer(16);
const view64 = new Float64Array(buffer);
view64[0] = 1.1234567890123456789; // bytes 0 - 7
console.log(view64[0]); // 1.1234567890123457
const view32 = new Float32Array(buffer);
view32[2] = 1.1234567890123456789; // bytes 8 - 11
console.log(view32[2]); // 1.1234568357467651
```

In this case, the decimal precision for the float64 number is accurate to the 15th
decimal, while the precision for the float32 number is only accurate to the 6th decimal.
This code exemplifies another thing of interest. In this case, there is a single ArrayBuffer
instance named buffer, and yet there are two different TypedArray instances that point
to this buffer data

When numeric values that are outside of the range of the supported TypedArray for
nonfloats are written, they need to go through some sort of conversion process to fit the
target data type. First, the number must be converted into an integer, as if it were passed
into Math.trunc(). If the value falls outside of the acceptable range, then it wraps around
and resets at 0 as if using the modulus (%) operator. Here are some examples of this
happening with a Uint8Array (which is a TypedArray with a max element value of 255):

```jsx
const buffer = new ArrayBuffer(8);
const view = new Uint8Array(buffer);
view[0] = 255;
view[1] = 256;
view[2] = 257;
view[3] = -1;
view[4] = 1.1;
view[5] = 1.999;
view[6] = -1.1;
view[7] = -1.9;
console.log(view);
```

In general, using multiple TypedArray views, especially those of different sizes, to look
into the same buffer instance is a dangerous thing and should be avoided when possible.
You might find that you accidentally clobber some data when performing different
operations. It is possible to pass more than one SharedArrayBuffer between threads, so
if you find yourself needing to mix types, then you might benefit from having more than
one buffer.

## Atomic Methods for Data Manipulation

Atomicity is a term that you might have heard before, particularly when it comes to
databases, where it’s the first word in the acronym ACID (atomicity, consistency, isolation,
durability). Essentially, if an operation is atomic, it means that while the overall operation
may be composed of multiple smaller steps, the overall operation is guaranteed to either
entirely succeed or entirely fail. For example, a single query sent to a database is going to
be atomic, but three separate queries aren’t atomic

If those three queries are wrapped in a database transaction, then the whole
lot becomes atomic; either all three queries run successfully, or none run successfully. It’s
also important that the operations are executed in a particular order, assuming they
manipulate the same state or otherwise have any side effects than can affect each other.
The isolation part means that other operations can’t run in the middle; for example, a
read can’t occur when only some of the operations have been applied.

Atomic operations are very important in computing, especially when it comes to
distributed computing. Databases, which may have many client connections, need to
support atomic operations. Distributed systems, where many nodes on a network
communicate, also need to support atomic operations. Extrapolating that idea a little,
even within a single computer where data access is shared across multiple threads,
atomicity is important.

JavaScript provides a global object named Atomics with several static methods available
on it. This global follows the same pattern as the familiar Math global. In either case you
can’t use the new operator to create a new instance, and the available methods are
stateless, not affecting the global itself. Instead, with Atomics, they’re used by passing in
a reference to the data that is to be modified.

### ATOMIC METHODS

### Atomics.add()

```jsx
old = Atomics.add(typedArray, index, value);
```

This method adds the provided value to the existing value in a typedArray that is located
at index. The old value is returned. Here’s what the nonatomic version might look like:

```jsx
const old = typedArray[index];
typedArray[index] = old + value;
return old;
```

### Atomics.and()

```
old = Atomics.and(typedArray, index, value)
```

This method performs a bitwise and using value with the existing value in typedArray
located at index. The old value is returned. Here’s what the nonatomic version might look
like:

```jsx
const old = typedArray[index];
typedArray[index] = old & value;
return old;
```

### Atomics.compareExchange()

```
old = Atomics.compareExchange(typedArray, index, oldExpectedValue, value)
```

This method checks typedArray to see if the value oldExpectedValue is located at index.
If it is, then the value is replaced with value. If not, then nothing happens. The old value
is always returned, so you can tell if the exchange succeeded if oldExpectedValue ===
old. Here’s what the nonatomic version might look like:

```jsx
const old = typedArray[index];
if (old === oldExpectedValue) {
  typedArray[index] = value;
}
return old;
```

### Atomics.exchange()

```
old = Atomics.exchange(typedArray, index, value)
```

This method sets the value in typedArray located at index to value. The old value is
returned. Here’s what the nonatomic version might look like:

```jsx
const old = typedArray[index];
typedArray[index] = value;
return old;
```

### Atomics.isLockFree()

```
free = Atomics.isLockFree(size)
```

This method returns a true if size is a value that appears as the BYTES_PER_ELEMENT for
any of the TypedArray subclasses (usually 1, 2, 4, 8), and a false if otherwise. If true,
then using the Atomics methods will be quite fast using the current system’s hardware. If
false, then the application might want to use a manual locking mechanism, like what is
covered in “Mutex: A Basic Lock”, especially if performance is the main concern.

### Atomics.load()

```
value = Atomics.load(typedArray, index)
```

This method returns the value in typedArray located at index. Here’s what the nonatomic
version might look like:

```jsx
const old = typedArray[index];
return old;
```

### Atomics.or()

```
old = Atomics.or(typedArray, index, value)
```

This method performs a bitwise or using value with the existing value in typedArray
located at index. The old value is returned. Here’s what the nonatomic version might look
like:

```jsx
const old = typedArray[index];
typedArray[index] = old | value;
return old;
```

### Atomics.store()

value = Atomics.store(typedArray, index, value)
This method stores the provided value in typedArray located at index. The value that
was passed in is then returned. Here’s what the nonatomic version might look like:

```jsx
typedArray[index] = value;
return value;
```

### Atomics.sub()

```
old = Atomics.sub(typedArray, index, value)
```

This method subtracts the provided value from the existing value in typedArray that is
located at index. The old value is returned. Here’s what the nonatomic version might look
like:

```jsx
const old = typedArray[index];
typedArray[index] = old - value;
return old;
```

### Atomics.xor()

```
old = Atomics.xor(typedArray, index, value)
```

This method performs a bitwise xor using value with the existing value in typedArray
located at index. The old value is returned. Here’s what the nonatomic version might look
like:

```jsx
const old = typedArray[index];
typedArray[index] = old ^ value;
return old;
```

## Atomicity Concerns

The methods covered in “Atomic Methods for Data Manipulation” are each guaranteed to
execute atomically. For example, consider the Atomics.compareExchange() method. This
method takes an oldExpectedValue and a new value, replacing the existing value only if
it equals oldExpectedValue with the new value. While this operation would take several
individual statements to represent with JavaScript, it’s guaranteed that the overall
operation will always execute entirely.

To illustrate this, imagine you have a Uint8Array named typedArray, and the 0th element
is set to 7. Then, imagine that multiple threads have access to that same typedArray, and
each of them executes some variant of the following line of code:

```jsx
let old1 = Atomics.compareExchange(typedArray, 0, 7, 1); // Thread #1
let old2 = Atomics.compareExchange(typedArray, 0, 7, 2); // Thread #2
```

It’s entirely nondeterministic the order that these three methods are called in, or even the
timing of their calls. In fact, they could be called simultaneously! However, with the
atomicity guarantee of the Atomics object, it’s guaranteed that exactly one of the threads
will have the initial 7 value returned, while the other thread will get the updated value of
1 or 2 returned.

On the other hand, if you’re using the nonatomic equivalent of compareExchange(), such
as reading and writing to typedArray[0] directly, it is entirely possible that the program
will accidentally clobber a value. In this case both threads read the existing value at about
the same time, then they both see that the original value is present, then they both write
at about the same time. Here is an annotated version of the nonatomic
compareExchange() code again:

```jsx
const old = typedArray[0]; // GET()
if (old === oldExpectedValue) {
  typedArray[0] = value; // SET(value)
}
```

This code performs multiple interactions with shared data, notably the line where the data
is retrieved (labeled as GET()) and later where the data is later set (labeled as
SET(value)). For this code to function properly it would need a guarantee that other
threads aren’t able to read or write to the value while the code is running. This
guarantees that only one thread gets exclusive access to shared resources is called a
critical section.

In this case both threads think they have successfully set the value, but the desired
outcome only persists for the second thread. This class of bug is referred to as a race
condition, where two or more threads are racing against each other to perform some
action. The worst thing about these bugs is that they don’t happen consistently, are
notoriously hard to reproduce, and may only happen in one environment, such as a
production server, and not another environment, like your development laptop.

To benefit from the atomic properties of the Atomics object when interacting with an
array buffer, you’ll need to take care when mixing Atomics calls with direct array buffer
access. If one thread of your application is using the compareExchange() method, and
another thread is directly reading and writing to the same buffer location, then the safety
mechanisms will have been defeated and your application will have nondeterministic
behavior. Essentially, when using Atomics calls, there’s an implicit lock in place to make
interactions convenient.

### RETURN VALUES IGNORE CONVERSION

One caveat concerning the Atomics methods is that the returned values aren’t
necessarily aware of the conversion that the particular TypedArray will go through,
but instead consider the value before going through the conversion. For example,
consider the following situation where a value is stored that is larger than what can be
represented by the given view:

```jsx
const buffer = new SharedArrayBuffer(1);
const view = new Uint8Array(buffer);
const ret = Atomics.store(view, 0, 999);
console.log(ret); // 999
console.log(view[0]); // 231
```

This code creates a buffer and then a Uint8Array view into that array. It then uses
Atomics.store() to store the value 999 using the view. The return value from the
Atomics.store() call is the value that was passed in, 999, even though the value that
was actually stored in the underlying buffer is the value 231 (999 is greater than the
maximum supported 255). You will need to keep this limitation in mind when building
your applications. To stay on the safe side, you should craft your application to not rely
on this data conversion and only write values that are within range.

## Data Serialization

Buffers are extremely powerful tools. That said, working with them from an entirely
numeric point of view can start to get a little difficult. Sometimes you’ll need to store
things that represent nonnumeric data using a buffer. When this happens you’ll need to
serialize that data in some manner before writing it to the buffer, and you’ll later need to
deserialize it when reading from the buffer.
Depending on the type of data that you’d like to represent, there will be different tools
that you can use to serialize it. Some tools will work for different situations, but each
comes with different trade-offs with regard to storage size and serialization performance.

### Booleans

Booleans are easy to represent because they take a single bit to store the data, and a bit
is less than a byte. So you can then create one of the smallest views, such as a
Uint8Array, then point it at an ArrayBuffer with a byte length of 1, and be set.

The following is an example of how to store and retrieve these boolean values so that
they’re backed in an ArrayBuffer:

```jsx
const buffer = new ArrayBuffer(1);
const view = new Uint8Array(buffer);
function setBool(slot, value) {
  view[0] = (view[0] & ~(1 << slot)) | ((value | 0) << slot);
}
function getBool(slot) {
  return !((view[0] & (1 << slot)) === 0);
}
```

This code creates a one-byte buffer (0b00000000 in binary) then creates a view into the
buffer. To set the value in the least significant digit in the ArrayBuffer to true, you would
use the call setBool(0, true). To set the second least significant digit to false, you would
call setBool(1, false). To retrieve the values stored at the third least significant digit,
you would then call getBool(2).

The setBool() function works by taking the boolean value and converting it into an
integer (value|0 converts false to 0 and true to 1). Then it “shifts the value left” by
adding zeros to the right based on which slot to store it in (0b1<<0 stays 0b1, 0b1<<1
becomes 0b10, etc.). It also takes the number 1 and shifts it based on the slot (so 0b1000
if the slot is 3), then inverts the bits (using ~), and gets a new value by AND-ing (&) the
existing value with this new value (view[0] & ~(1 << slot)). Finally, the modified old
value and the new shifted values are OR-ed together (|) and assigned to view[0].
Basically, it reads the existing bits, replaces the appropriate bit, and writes the bits back.

The getBool() function works by taking the number 1, shifting it based on the slot, then
using & to compare it to the existing value. The shifted value (on the right of &) only
contains a single 1 and seven 0s. The AND-ing between this modified value and the
existing value returns either a number representing the value of the shifted slot, assuming
the value at the slot position located at view[0] was truthy; otherwise, it returns 0. This
value is then checked to see if it is exactly equal to 0 (===0), and the result of that is
negated (!). Basically, it returns the value of the bit at slot.

### Strings

Strings aren’t as easy to encode as they may seem at first glance. It’s easy to assume that
each character in a string can be represented using a single byte, and that the .length
property of a string is sufficient to choose the size of a buffer to store it in. While this may
seem to work sometimes, particularly with simple strings, you’ll soon encounter errors
when dealing with more complex data.

The reason this will work with simple strings is that data represented using ASCII does
allow a single character to fit into a single byte. In fact, in the C programming language,
the data storage type that represents a single byte of data is referred to as a char.

There are many ways to encode individual characters using strings. With ASCII the entire
range of characters can be represented with a byte, but in a world of many cultures,
languages, and emojis, it’s absolutely impossible to represent all these characters in such
a manner. Instead, we use encoding systems where a variable number of bytes can be
used to represent a single character. Internally, JavaScript engines use a variety of
encoding formats to represent strings depending on the situation, and the complexity of
this is hidden from our applications. One possible internal format is UTF-16, which uses 2
or 4 bytes to represent a character, or even up to 14 bytes to represent certain emojis. A
more universal standard is UTF-8, which uses 1 to 4 bytes of storage per character and is
backwards compatible with ASCII.

The following is an example of what happens when a string is iterated using its .length
property and the resulting values are mapped to a Uint8Array instance:

```JSX
// Warning: Antipattern!
function stringToArrayBuffer(str) {
 const buffer = new ArrayBuffer(str.length);
 const view = new Uint8Array(buffer);
 for (let i = 0; i < str.length; i++) {
 view[i] = str.charCodeAt(i);
 }
 return view;
}
stringToArrayBuffer('foo'); // Uint8Array(3) [ 102, 111, 111 ]
stringToArrayBuffer('€'); // Uint8Array(1) [ 172 ]
```

In this case storing the basic string foo is fine. However, the € character, which is really
represented by the value 8,364, is greater than the maximum 255 value supported by
Uint8Array and has accordingly been truncated to 172. Converting that number back into
a character gives the wrong value.

An API is available to modern JavaScript for encoding and decoding strings directly to
ArrayBuffer instances. This API is provided by the globals TextEncoder and
TextDecoder, both of which are constructors and are globally available in modern
JavaScript environments including browsers and Node.js. These APIs encode and decode
using the UTF-8 encoding due to its ubiquity.

Here’s an example of how to safely encode strings into the UTF-8 encoding using this API:

```JSX
const enc = new TextEncoder();
enc.encode('foo'); // Uint8Array(3) [ 102, 111, 111 ]
enc.encode('€'); // Uint8Array(3) [ 226, 130, 172 ]
```

And here’s how to decode such values:

```jsx
const ab = new ArrayBuffer(3);
const view = new Uint8Array(ab);
view[0] = 226;
view[1] = 130;
view[2] = 172;
const dec = new TextDecoder();
dec.decode(view); // '€'
dec.decode(ab); // '€'
```

Notice that TextDecoder#decode() works with either the Uint8Array view, or with the
underlying ArrayBuffer instance. This makes it convenient to decode data that you might
get from a network call without the need to first wrap it in a view.

### Objects

Considering that objects can already be represented as strings using JSON, you do have
the option of taking an object that you’d like to make use of across two threads,
serializing it into a JSON string, and writing that string to an array buffer using the same
TextEncoder API that you worked with in the previous section. This can essentially be
performed by running the following code:

```jsx
const enc = new TextEncoder();
return enc.encode(JSON.stringify(obj));
```

JSON takes a JavaScript object and converts it into a string representation. When this
happens, there are many redundancies in the output format. If you wanted to reduce the
size of a payload even more, you could make use of a format like MessagePack, which is
able to reduce the size of a serialized object even more by representing object metadata
using binary data. This makes tools like MessagePack not necessarily a good fit in
situations where plain text is appropriate, like an email, but in situations where binary
buffers are passed around it might not be as bad. The msgpack5 npm package is a browser
and Node.js compatible package for doing just that.
