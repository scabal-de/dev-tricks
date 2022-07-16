# Chapter 8. Analysis

## When Not to Use

Threading is not a magic bullet capable of solving an
application’s performance problems. It is usually not the
lowest-hanging fruit when it comes to performance, either,
and should often be done as a final effort.

This is particularly
true in JavaScript, where multithreading isn’t as widely
understood by the community as other languages. Adding
threading support may require heavy changes to an
application, which means your effort-to-performance gains
will likely be higher if you first hunt down other code
inefficiencies first.

Once that’s done, and you’ve made your application
performant in other areas, you are then left with the question,
“Is now a good time to add multithreading?” The rest of this
section contains some situations where adding threads will
most likely not provide any performance benefits. This can
help you avoid going through some of the discovery work.

### Low Memory Constraints

There is some additional memory overhead incurred when
instantiating multiple threads in JavaScript. This is because
the browser needs to allocate additional memory for the new
JavaScript environment—this includes things like globals and
APIs available to your code as well as under-the-hood memory
used by the engine itself. This overhead might prove to be
minimal in a normal server environment in the case of Node.js
or a beefy laptop in the case of browsers

What’s the memory impact of additional threads? It’s a little
hard to quantify, and it changes depending on the JavaScript
engine and platform. The safe answer is that, like most
performance aspects, you should measure it in a real-world
environment. But we can certainly try to get some concrete
numbers.

First, let’s consider a dead simple Node.js program that just
kicks off a timer and doesn’t pull in any third-party modules.
This program looks like the following:

```jsx
#!/usr/bin/env node
const { Worker } = require("worker_threads");
const count = Number(process.argv[2]) || 0;
for (let i = 0; i < count; i++) {
  new Worker(__dirname + "/worker.js");
}
console.log(`PID: ${process.pid}, ADD THREADS: ${count}`);
setTimeout(() => {}, 1 * 60 * 60 * 1000);
```

Running the program and measuring memory usage looks like
this:

```
# Terminal 1
$ node leader.js 0
# PID 10000
# Terminal 2
$ pstree 10000 -pa # Linux only
$ ps -p 10000 -o pid,vsz,rss,pmem,comm,args
```

The pstree command displays the threads used by the
program. It displays the main V8 JavaScript thread, as well as
some of the background threads covered in “Hidden Threads”.
Here is an example output from the command:

```
node,10000 ./leader.js
 ├─{node},10001
 ├─{node},10002
 ├─{node},10003
 ├─{node},10004
 ├─{node},10005
 └─{node},10006
```

The ps command displays information about the process,
notably the memory usage of the process

There are two important variables here used to measure the
memory usage of a program, both of them measured in
kilobytes. The first here is VSZ, or virtual memory size, which
is the memory the process can access including swapped
memory, allocated memory, and even memory used by shared
libraries (such as TLS), approximately 1.4 GB. The next is RSS,
or resident set size, which is the amount of physical memory
currently being used by the process, approximately 48 MB.

Measuring memory can be a little hand wavy, and it’s tricky to
estimate how many processes can actually fit in memory. In
this case, we’ll mostly be looking at the RSS value.

### Low Core Count

Your application will run slower in situations where it has
fewer cores. This is especially true if the machine has a single
core, and it can also be true if it has two cores. Even if you
employ a thread pool in your application and scale the pool
based on the core count, the application will be slower if it
creates a single worker thread. When creating an additional
thread, the application now has at least two threads (the main
and the worker), and the two threads will compete with each
other for attention.

Another reason your application will slow down is that there is
additional overhead when it comes to communicating between
threads. With a single core and two threads, even if the two
never compete for resources, i.e., the main thread has no
work to do while the worker is running and vice versa, there
is still an overhead when performing message passing
between the two threads.

This might not be a huge deal. For example, if you create a
distributable application that runs in many environments,
often running on multicore systems and infrequently on
single-core systems, then this overhead might be OK. But if
you’re building an application that almost entirely runs in a
single-core environment, you would likely be better off by not
adding threading at all. That is, you probably shouldn’t build
an app that takes advantage of your beefy multicore developer
laptop and then ship it to production where a container
orchestrator limits the app to a single core.

How much of a performance loss are we talking? On the Linux
operating system it’s straightforward to tell the OS that a
program, and all of its threads, should only run on a subset of
CPU cores. The use of this command allows developers to test
the effects of running a multithreaded application in a low
core environment. If you’re using a Linux-based computer,
then feel free to run these examples; if not, a summary will be
provided.

First, go back to the ch6-thread-pool/ example that you
created. Execute the application so that it
creates a worker pool with two workers:

```jsx
$ THREADS=2 STRATEGY=leastbusy node main.js
```

Note that with a thread pool of 2, the application has three
JavaScript environments available, and libuv should have a
default pool of 5, leading to a total of about eight threads as of
Node.js v16. With the program running and able to access all
of the cores on your machine, you’re ready to run a quick
benchmark. Execute the following command to send a barrage
of requests to the server:

```
$ npx autocannon http://localhost:1337/
```

In this case we’re just interested in the average request rate,
identified in the last table of the output with the Req/Sec row
and the Avg column. In one sample run the value of 17.5 was
returned.
Kill the server with Ctrl+C and run it again. But this time use
the taskset command to force the process (and all of its child
threads) to use the same CPU core:

```
# Linux only command
$ THREADS=2 STRATEGY=leastbusy taskset -c 0 node main.js
```

In this case the two environment variables THREADS and
STRATEGY are set, then the taskset command is run. The -c 0
flag tells the command to only allow the program to use the
0th CPU. The arguments that follow are then treated as the
command to run. Note that the taskset command can also be
used to modify an already running process

Here’s a copy of that output when the
command is used on a computer with 16 cores:

```
pid 211154's current affinity list: 0-15
pid 211154's new affinity list: 0
```

In this case it says that the program used to have access to all
16 cores (0–15), but now it only has access to one (0).

With the program running and locked to a single CPU core to
emulate an environment with fewer cores available, run the
same benchmark command again:

```
$ npx autocannon http://localhost:1337/
```

In one such run the average requests per second has been
reduced to 8.32. This means that the throughput of this
particular program, when trying to use three JavaScript
threads in a single-core environment, leads to a performance
of 48% when compared to having access to all cores!

A natural question might be: in order to maximize the
throughput of the ch6-thread-pool application, how large
should the thread pool be and how many cores should be
provided to the application? To find an answer, 16
permutations of the benchmark were applied to the
application and the performance was measured.

### Containers Versus Threads

With Docker containers you can Horizontal scaling benefits
performance in a way that allows developers to fine-tune the
performance of the whole fleet of applications. Such tuning
can’t be performed as easily when the scaling primitive
happens within the program, in the form of a thread pool.

Orchestrators, such as Kubernetes, are tools that run
containers across multiple servers. They make it easy to scale
an application on demand; during the holiday season an
engineer can manually increase the number of instances
running.

Orchestrators can also dynamically change the scale
depending on other heuristics like CPU usage, traffic
throughput, and even the size of a work queue.

## When to Use

Here are
some of the most straightforward characteristics of such a
problem to keep an eye out for:

Embarrassingly parallel

- This is a class of problems where a large task can be
  broken down into smaller tasks and very little or no
  sharing of state is required. One such problem is the Game
  of Life simulation covered in “Example Application:
  Conway’s Game of Life”. With that problem, the game grid
  can be subdivided into smaller grids, and each grid can be
  dedicated to an individual thread.

Heavy math

- Another characteristic of problems that are a good fit for
  threads are those that involve a heavy use of math, aka
  CPU-intensive work. Sure, one might say that everything a
  computer does is math, but the inverse of a math-heavy
  application is one that is I/O heavy, or one that mostly deals
  with network operations. Consider a password hash
  cracking tool that has a weak SHA1 digest of a password.
  Such tools may work by running the Secure Hash
  Algorithm 1 (SHA1) algorithm over every possible
  combination of 10 character passwords, which is a lot of
  number crunching indeed.

MapReduce-friendly problems

- MapReduce is a programming model that is inspired by
  functional programming. This model is often used for largescale data processing that has been spread across many
  different machines. MapReduce is broken into two pieces.
  The first is Map, which accepts a list of values and
  produces a list of values. The second is Reduce, where the
  list of values are iterated on again, and a singular value is
  produced. A single-threaded version of this could be
  created in JavaScript using Array#map() and
  Array#reduce(), but a multithreaded version requires
  different threads processing subsets of the lists of data. A
  search engine uses Map to scan millions of documents for
  keywords, then Reduce to score and rank them, providing a
  user with a page of relevant results. Database systems like
  Hadoop and MongoDB benefit from MapReduce.

Graphics processing

- A lot of graphics processing tasks also benefit from
  multiple threads. Much like the Game of Life problem,
  which operates on a grid of cells, images are represented
  as a grid of pixels. In both cases the value at each
  coordinate can be represented as a number, though Game
  of Life uses a single 1-bit number while images are more
  likely to use 3 or 4 bytes (red, green, blue, and optional
  alpha transparency). Image filtering then becomes a
  problem of subdividing an image into smaller images,
  having threads in a thread-pool process with the smaller
  images in parallel, then updating the interface once the
  change is complete.

This isn’t a complete list of all the situations in which you
should use multithreading; it’s just a list of some of the most
obvious use cases.

Another use case that’s particularly beneficial to JavaScript
applications is that of template rendering. Depending on the
library used, the rendering of a template might be done using
a string that represents the raw template and an object that
contains variables to modify the template.

Create a new directory named
ch8-template-render/. Inside this directory, copy and paste the
existing ch6-thread-pool/rpc-worker.js

Although the file will work fine unmodified, you should
comment out the console.log() statement so that it doesn’t
slow down the benchmark

You’ll also want to initialize an npm project and install some
basic packages. You can do this by running the following
commands:

```
$ npm init -y
$ npm install fastify@3 mustache@4
```

Next, create a file named server.js. This represents an HTTP
application that performs basic HTML rendering when it
receives a request. This benchmark is going to use some realworld packages instead of loading built-in modules for
everything. Start the file off with the content below

**Example: ch8-template-render/server.js (part 1)**

```jsx
#!/usr/bin/env node
// npm install fastify@3 mustache@4
const Fastify = require("fastify");
const RpcWorkerPool = require("./rpc-worker.js");
const worker = new RpcWorkerPool("./worker.js", 4, "leastbusy");
const template = require("./template.js");
const server = Fastify();
```

The file starts off by instantiating the Fastify web framework,
as well as a worker pool with four workers. The application
also loads a module named template.js that will be used to
render templates used by the web application.

Now, you’re ready to declare some routes and to tell the
server to listen for requests. Keep editing the file by adding
the content below

**Example: ch8-template-render/server.js (part 2)**

```jsx
server.get("/main", async (request, reply) =>
  template.renderLove({ me: "Thomas", you: "Katelyn" })
);
server.get("/offload", async (request, reply) =>
  worker.exec("renderLove", { me: "Thomas", you: "Katelyn" })
);
server.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`listening on: ${address}`);
});
```

Two routes have been introduced to the application. The first
is GET /main and will perform the rendering of the request in
the main thread. This represents a single-threaded
application. The second route is GET /offload, where the
rendering work will be offloaded to a separate worker thread.
Finally, the server is instructed to listen on port 3000.

At this point the application is functionally complete. But as
an added bonus, it would be nice to be able to quantify the
amount of work that the server is busy doing. While it’s true
that we can primarily test the efficiency of this application by
using an HTTP request benchmark, sometimes it’s nice to look
at other numbers as well.

Add the nex content:

**Example: ch8-template-render/server.js (part 3)**

```jsx
const timer = process.hrtime.bigint;
setInterval(() => {
  const start = timer();
  setImmediate(() => {
    console.log(`delay: ${(timer() - start).toLocaleString()}ns`);
  });
}, 1000);
```

This code uses a setInterval call that runs every second. It
wraps a setImmediate() call, measuring current time in
nanoseconds before and after the call is made. It’s not perfect,
but it is one way to approximate how much load the process is
currently receiving. As the event loop for the process gets
busier, the number that is reported will get higher. Also, the
busyness of the event loop affects the delay of asynchronous
operations throughout the process. Keeping this number
lower therefore correlates to a more performant application.

After create the file worker.js and add the below:

**Example ch8-template-render/worker.js**

```jsx
const { parentPort } = require("worker_threads");
const template = require("./template.js");
function asyncOnMessageWrap(fn) {
  return async function (msg) {
    parentPort.postMessage(await fn(msg));
  };
}
const commands = {
  renderLove: (data) => template.renderLove(data),
};
parentPort.on(
  "message",
  asyncOnMessageWrap(async ({ method, params, id }) => ({
    result: await commands[method](...params),
    id,
  }))
);
```

This is a modified version of the worker file that you created
before. In this case a single command is used, renderLove(),
which accepts an object with key value pairs to be used by the
template rendering function.
Finally, create a file named template.js, and add the content below

**Example: ch8-template-render/template.js**

```jsx
const Mustache = require("mustache");
const love_template = "<em>{{me}} loves {{you}}</em> ".repeat(80);
module.exports.renderLove = (data) => {
  const result = Mustache.render(love_template, data);
  // Mustache.clearCache();
  return result;
};
```

In a real-world application, this file might be used for reading
template files from disk and substituting values, exposing a
complete list of templates. For this simple example just a
single template renderer is exported and a single hard-coded
template is used. This template uses two variables, me and
you. The string is repeated many times to approach the length
of a template that a real application might use. The longer the
template, the longer it takes to render.

Now that the files have been created, you’re ready to run the
application. Run the following commands to run the server
and then to launch a benchmark against it:

```
# Terminal 1
$ node server.js
# Terminal 2
$ npx autocannon -d 60 http://localhost:3000/main
$ npx autocannon -d 60 http://localhost:3000/offload
```

On a test run on a beefy 16-core laptop, when rendering
templates entirely in the main thread, the application had an
average throughput of 13,285 requests per second. However,
when running the same test while offloading template
rendering to a worker thread, the average throughput was
18,981 requests per second. In this particular situation it
means the throughput increased by about 43%.

The event loop latency also decreased significantly. Sampling
the time it takes to call setImmediate() while the process is
idle gets us about 87 μs on average. When performing
template rendering in the main thread, the latency averages
769 μs. The same samples taken when offloading rendering to
a worker thread are on average 232 μs. Subtracting out the
idle state from both values means it’s about a 4.7x
improvement when using threads.

## Summary of Caveats

This is a combined list of the aforementioned caveats when
working with threads in JavaScript:

Complexity

- Applications tend to be more complex when using shared
  memory. This is especially true if you are hand-writing calls
  with Atomics and manually working with
  SharedBufferArray instances. Now, admittedly, a lot of
  this complexity can be hidden from the application through
  the use of a third-party module. In such a case it can be
  possible to represent your workers in a clean manner,
  communicating with them from the main thread, and
  having all the intercommunication and coordination
  abstracted away.

Memory overhead

- There is additional memory overhead with each thread that
  is added to a program. This memory overhead is
  compounded if a lot of modules are being loaded in each
  thread. Although the overhead might not be a huge deal on
  modern computers, it is worth testing on the end hardware
  the code will ultimately run on just to be safe. One way to
  help alleviate this issue is to audit the code that is being
  loaded in separate threads. Make sure you’re not
  unnecessarily loading the kitchen sink!

No shared objects

- The inability to share objects between threads can make it
  difficult to easily convert a single-threaded application to a
  multithreaded one. Instead, when it comes to mutating
  objects, you’ll need to pass messages around that end up
  mutating an object that lives in a single location.

No DOM access

- Only the main thread of a browser-based application has
  access to the DOM. This can make it difficult to offload UI
  rendering tasks to another thread. That said, it’s entirely
  possible for the main thread to be in charge of DOM
  mutation while additional threads can do the heavy lifting
  and return data changes to the main thread to update the
  UI.

Modified APIs

- Along the same lines as the lack of DOM access, there are
  slight changes to APIs available in threads. In the browser
  this means no calls to alert(), and individual worker types
  have even more rules, like disallowing blocking
  XMLHttpRequest#open() requests, localStorage
  restrictions, top-level await, etc. While some concerns are
  a little fringe, it does mean that not all code can run
  unmodified in every possible JavaScript context.
  Documentation is your friend when dealing with this.

Structured clone algorithm constraints

- There are some constraints on the structured clone
  algorithm that may make it difficult to pass certain class
  instances between different threads. Currently, even if two
  threads have access to the same class definition, instances
  of the class passed between threads become plain Object
  instances. While it’s possible to rehydrate the data back
  into a class instance, it does require manual effort.

Browsers require special headers

- When working with shared memory in the browser via
  SharedArrayBuffer, the server must supply two additional
  headers in the request for the HTML document used by the
  page. If you have complete control of the server, then these
  headers may be easy to introduce. However, in certain
  hosting environments, it might be difficult or impossible to
  supply such headers. Even the package used in this book to
  host a local server required modifications to enable the
  headers.

Thread preparedness detection

- There is no built-in functionality to know when a spawned
  thread is ready to work with shared memory. Instead, a
  solution must first be built that essentially pings the thread
  and then waits until a response has been received.

## Appendix. Structured Clone Algorithm

The structured clone algorithm is a mechanism that
JavaScript engines use when copying objects using certain
APIs. Most notably, it’s used when passing data between
workers, though other APIs use it as well. With this
mechanism, data is serialized and then later deserialized as
an object inside another JavaScript realm.

When objects are cloned in this manner, such as from the
main thread to a worker thread or from one worker to
another, modifying an object on one side will not affect the
object on the other side. There are essentially two copies of
the data now. The purpose of the structured clone
algorithm is to provide a friendlier mechanism for
developers than what JSON.stringify does, while
imposing reasonable limitations.

Browsers use the structured clone algorithm when copying
data between web workers. Node.js, similarly, uses it when
copying data between worker threads. Basically, when you
see a .postMessage() call, data being passed in is cloned
in this way. Browsers and Node.js follow the same rules,
but they each support additional object instances that can
be copied

First off, all of the primitive data types available in
JavaScript, with the exception of the Symbol type, can be
represented. This includes the Boolean, null, undefined,
Number, BigInt, and String types.

Instances of Array, Map, and Set, which are each used for
storing collections of data, can also be cloned in this
manner. Even ArrayBuffer, ArrayBufferView, and Blob
instances, which store binary data, can be passed along.

Instances of some more complex objects, as long as they
are quite universal and well understood, can also be passed
through. This includes objects created using the Boolean
and String constructor, Date, and even RegExp instances.

On the browser side, more complex and lesser-known
object instances like those for File, FileList,
ImageBitmap, and ImageData can be cloned.

On the Node.js side, special object instances that can be
copied over include WebAssembly.Module, CryptoKey,
FileHandle, Histogram, KeyObject, MessagePort,
net.BlockList, net.SocketAddress, and
X509Certificate. Even instances of ReadableStream,
WritableStream, and TransformStream can be copied.

Another notable difference that works with the structured
clone algorithm, but doesn’t work with JSON objects, is
that recursive objects (those with nested properties that
reference another property) can also be cloned. The
algorithm is smart enough to stop serializing an object once
it encounters a duplicate, nested object.

Another missing feature, which will likely affect your
implementations, is that DOM elements in the browser
cannot be passed along.
