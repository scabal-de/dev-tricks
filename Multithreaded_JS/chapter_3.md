# Chapter 3: Node.js - Multitreaded JavaScript

## Introduction:

Node.js is tarted as a platform emphasizing single threaded
concurrency on servers with continuation step style callbacks

The common use of Node.js when started was serving web requests or handling
network connections, but later was added a lot of programs such as command-line tools acting as build systems, for example:

- Tools like **Babel** and **TypeScript** will transform
  your code from one language (or language version) to
  another.
- Tools like **Webpack**, **Rollup**, and **Parcel** will group
  and will minify your code for distribution to your web frontend
  or to other environments where load times are crucial, like
  serverless environments.

### Is Node Js Single-threaded:

The answer is yes and no.
To understand what magic the Node Js potion performs, you should be aware of its ingredients first. Node Js has two main dependencies:

- **V8**

  It provides the Javascript Engine i.e., to run JS outside the browser.

- **libuv:**

  This is a C library used to access the underlying OS features such as networking, file systems, concurrency, cryptography, etc(I/O intensive & CPU-intensive tasks). Libuv includes a thread pool for offloading work for some things that can’t be done asynchronously at the OS level.

  ![N|solid](https://miro.medium.com/max/1126/1*0-sExR87yqqJ05SQS6vzdw.jpeg)

In Node Js there are two types of threads:

- **Event Loop:** Handles the initialization & callbacks(aka: main loop, the main thread, event thread, etc).
- **Threadpool:** A pool of Workers in a Worker Pool.

Whenever you run a js file, Node first creates a single thread and runs everything in that thread, called the Event Loop. But, when it comes across some tasks like fs.readFile() (fs is the File System module, it enables you to interact with the file system) or using crypto.pbkdf2() (crypto module provides you with cryptographic functionality that includes a set of wrappers for OpenSSL’s hash, HMAC, cipher, decipher, sign, and verify functions.

**See an example on: Projects/ch3-threads/threads.js**

![N|solid](https://miro.medium.com/max/1082/1*jpQUqpaV5hyhzAqMVZYbxw.png)

**See an example on: Projects/ch3-threads/multitask.js**

In situations where load times are crucial, while
there’s a lot of filesystem I/O going on, there’s also a lot of
data processing, which is generally done synchronously.
These are the sorts of situations where parallelism is handy
and might get the job done quicker.

Parallelism can be useful in the original Node.js use
case (servers)

## Aspects to consider:

**Child processes** were the initial means of creating multiple threads for an application and have been available since version 0.10. This was achieved by spawning a node process for every additional thread you wanted created.

**Clustering**, which has been a stable release since around version 4, allows us to simplify the creation and management of Child Processes. It works brilliantly when combined with PM2.

- PM2 is a daemon process manager that will help you manage and keep your application online 24/7\*\*

**Multithreading already exists for I/O tasks** \*\*

There is a layer of Node that's already multithreaded and that is the libuv thread-pool. I/O tasks such as files and folder management, TCP/UDP transactions, compression and encryption are handed off to libuv, and if not asynchronous by nature, get handled in the libuv's thread-pool.

**Child Processes/Worker Threads only work for synchronous JavaScript logic**

Implementing multithreading using Child Processes or Worker Threads will only be effective for your synchronous JavaScript code that's performing heavy duty operations, such as looping, calculations, etc. If you try to offload I/O tasks to Worker Threads as an example, you will not see a performance improvement.

## when to use paralellism?

- **server side rendering (SSR)**

  involves a lot of string manipulation where the source data is already known.

- **Embarrassingly parallel**

  This is a class of problems where a large task can bebroken down into smaller tasks and very little or nosharing of state is required.

- **Heavy math**

  Another characteristic of problems that are a good fit forthreads are those that involve a heavy use of math, aka CPU-intensive work.

  Example:

  - A service that is I/O heavy,
  - A service that mostly dealswith network operations.
  - Etc...

- **MapReduce-friendly problems**

  MapReduce is a programming model that is inspired byfunctional programming. This model is often used for large-scale data processing that has been spread across manydifferent machines.

  Example:

  - A search engine uses Map to scan millions of documents forkeywords, then Reduce to score and rank them, providing auser with a page of relevant results.

- **Graphics processing**

  A lot of graphics processing tasks also benefit from multiple threads such as video games a data models

## Concurrency Versus Parallelism

If you wanted to
take advantage of CPU cores, you needed to use processes
if shared memory isn’t important (and in many
cases it isn’t!) then processes are perfectly able to solve
these kinds of problems for you.

first you need to know the differences between concurrency and parallelism

## Concurrency

Concurrency is the ability of the CPU to process more than one process at the same time.

If the processor has a CORE, then it will only be able to execute one process at a time, on the other hand, if we have 8 CORES, then we will be able to execute up to 8 processes at the same time.

![N|solid](https://www.oscarblancarteblog.com/wp-content/uploads/2017/03/1-1.png)

Running processes do not have to be related, that is, anyone can start and end at any time, and the result of one does not affect the other.

## Parallelism

The parallelism follows the philosophy of "divide and conquer", since it consists of taking a single problem, and by means of concurrence arrive at a faster solution.

The main difference of parallelism versus concurrency is that, in parallelism, all concurrent processes are closely related to solving the same problem, in such a way that the result of the other processes affects the final result.

**NOTE**: In the parallelism there must be a final step that is responsible for joining the results of all the processes to be able to produce a final result.

![N|solid](https://www.oscarblancarteblog.com/wp-content/uploads/2017/03/2.png)

For each CORE available, a concurrent process is launched to solve a fraction of the problem. When the process of a CORE ends, it leaves its result as a part of the final result (Orange), thus when finishing all the concurrent processes, we have a final result (Yellow)

## ways to make use of parallelism

- **Cluster**

  Cluster module’s purpose is to spread network traffic across
  several worker processes, thus avoiding overloading a single processor core.

      Example using cluster in a simple "Hello World".

      The code in the example is a standard HTTP server in
      Node.js. It simply responds to any request, regardless of
      path or method, with “Hello, World!” followed by a new line
      character.

  **"A “Hello, World” server in Node.js"**

  ```jsx
  const http = require("http");
  const cluster = require("cluster"); //Require the cluster module.

  if (cluster.isPrimary) {
    //Change code paths depending on whether we’re in the primary process.
    cluster.fork(); //In the primary process, create four worker processes.
    cluster.fork();
    cluster.fork();
    cluster.fork();
  } else {
    http
      .createServer((req, res) => {
        res.end("Hello, World!\n");
      })
      .listen(3000); //In the worker processes, create a web server and listen, like in example before.
  }
  ```

  When worker processes are set up in a cluster, any call to

  listen() will actually cause Node.js to listen on the
  primary process rather than on the worker. Then, once a
  connection is received in the primary process, it’s handed
  off to a worker process via IPC

  the primary process is the only one that are
  listening that port and passing connections off to all the
  workers.

  Processes incur some extra overhead that threads don’t,

  and we also don’t get shared memory, which helps with
  faster transfer of data. For that, we need the
  worker_threads module.

- **The worker_threads Module**

  Node.js’s support for threads is in a built-in module called

  worker_threads. It provides an interface to threads that
  mimics a lot of what you’d find in web browsers for web
  workers.

  **Note:**

  you’ll find that adding
  more threads via worker_threads won’t lighten the load.
  Instead, apart from considering various caching solutions
  and other optimizations, consider increasing your
  UV_THREADPOOL_SIZE

  You can create a new worker thread by using the Worker constructor, like in the next example.

  **Spawning a new worker thread in Node.js**

  ```jsx
  const { Worker } = require("worker_threads");

  //The filename here is the entrypoint file that we want to run inside the worker thread.
  const worker = new Worker("/path/to/worker-file-name.js");
  ```

  ### workerData

  We interact with our work thread with the workerData property, its content will be copied to the work thread.

  Example:

  **Passing data to a worker thread via workerData**

  ```jsx
  const { Worker, isMainThread, workerData } = require("worker_threads");
  const assert = require("assert");

  //Rather than using a separate file for the worker thread,
  //we can use the current file with __filename and switch
  //the behavior based on isMainThread
  if (isMainThread) {
    const worker = new Worker(__filename, { workerData: { num: 42 } });
  } else {
    assert.strictEqual(workerData.num, 42);
  }
  ```

  _It’s important to note that the properties of the workerData
  object are cloned rather than shared between threads._

  ### MessagePort

  A MessagePort is one end of a two-way data stream. By
  default, one is provided to every worker thread to provide a
  communication channel to and from the main thread. It’s
  available in the worker thread as the parentPort property
  of the worker_threads module.

  To send a message via the port, the postMesage() method
  is called on it.

  When a message is received on the port, the
  message event is fired, with the message data being the
  first argument to the event handler function.

  The next example shows where messages sent to the main thread are
  echoed back to a worker thread.

  **EXAMPLE: Bidirectional communication via the default
  MessagePorts**

  ```jsx
  const { Worker, isMainThread, parentPort } = require("worker_threads");

  if (isMainThread) {
    const worker = new Worker(__filename);
    worker.on("message", (msg) => {
      worker.postMessage(msg);
    });
  } else {
    parentPort.on("message", (msg) => {
      console.log("We got a message from the main thread:", msg);
    });
    parentPort.postMessage("Hello, World!");
  }
  ```

  You can also create a pair of MessagePort instances

  connected to each other via the MessageChannel
  constructor. You can then pass one of the ports via an
  existing message port (like the default one) or via
  workerData.

  You might want to do this in situations where

  neither of two threads that need to communicate are the
  main thread, or even just for organizational purposes.

  The example below is the same as the previous example, except

  using ports created via MessageChannel and passed via
  workerData.

  ```jsx
  const {
    Worker,
    isMainThread,
    MessageChannel,
    workerData,
  } = require("worker_threads");

  if (isMainThread) {
    const { port1, port2 } = new MessageChannel();
    const worker = new Worker(__filename, {
      workerData: {
        port: port2,
      },
      transferList: [port2],
    });
    port1.on("message", (msg) => {
      port1.postMessage(msg);
    });
  } else {
    const { port } = workerData;
    port.on("message", (msg) => {
      console.log("We got a message from the main thread:", msg);
    });
    port.postMessage("Hello, World!");
  }
  ```

  You’ll notice we used the transferList option when

  instantiating the Worker

  This is a way of transferring
  ownership of objects from one thread to another. This is
  required when sending any MessagePort, ArrayBuffer, or
  FileHandle objects via workerData or postMessage.

  Once these objects are transferred, they can no longer be used
  on the sending side.
