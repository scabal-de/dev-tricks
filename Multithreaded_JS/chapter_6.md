# Chapter 6. Multithreaded Patterns

The JavaScript APIs that expose multithreading are, on their own, really quite basic with
the functionality they provide.

- Popular design patterns for implementing multithreaded
  functionality inside an application.

## Thread Pool

The thread pool is a very popular pattern that is used in most multithreaded applications
in some form or another. Essentially, a thread pool is a collection of homogeneous worker
threads that are each capable of carrying out CPU-intensive tasks that the application
may depend on.

This differs somewhat from the approach you’ve been using so far where
usually a single worker thread, or a finite number of workers, has been used. As an
example of this, the libuv library that Node.js depends on provides a thread pool,
defaulting to four threads, for performing low-level I/O operations.

This pattern might feel similar to distributed systems that you may have worked with in
the past. For example, with a container orchestration platform, there’s usually a collection
of machines that are each capable of running application containers. With such a system
each machine might have different capabilities, such as running different operating
systems or having different memory and CPU resources. When this happens, the
orchestrator may assign points to each machine based on resources and applications,
then consume said points. On the other hand, a thread pool is much simpler because each
worker is capable of carrying out the same work and each thread is just as capable as the
other since they’re all running on the same machine.

The first question when creating a thread pool is how many threads should be in the pool?

### Pool Size

There are essentially two types of programs: those that run in the background, like a
system daemon process, which ideally shouldn’t consume that many resources, and
programs that run in the foreground that any given user is more likely to be aware of, like
a desktop application or a web server. Browser applications are usually constrained to
running as foreground applications, whereas Node.js applications are free to run in the
background—though Node.js is most commonly used to build servers, frequently as the
only process inside a container

In either case, the intent with a JavaScript application is
often to be the main focus at a particular point in time, and any computations necessary
to achieve the purpose of the program should ideally be executed as soon as possible.

To execute instructions as quickly as possible, it makes sense to break them up and run
them in parallel. To maximize CPU usage it figures that each of the cores in a given CPU
should be used, as equally as possible, by the application. Thus, the number of CPU cores
available to the machine should be a determining factor for the number of threads—aka
workers—an application should use.

Typically, the size of a thread pool won’t need to dynamically change throughout the
lifetime of an application. Usually there’s a reason the number of workers is chosen, and
that reason doesn’t often change. That’s why you’ll work with a thread pool with a fixed
size, dynamically chosen when the application launches.

Here is the idiomatic approach for getting the number of threads available to the
currently running JavaScript application, depending on whether the code runs inside a
browser or inside a Node.js process:

```jsx
// browser
cores = navigator.hardwareConcurrency;
// Node.js
cores = require("os").cpus().length;
```

One thing to keep in mind is that with most operating systems there is not a direct
correlation between a thread and a CPU core. For example, when running an application
with four threads on a CPU with four cores, it’s not like the first core is always handling
the first thread, the second core the second thread, and so forth. Instead, the operating
system constantly moves tasks around, occasionally interrupting a running program to
handle the work of another application. In a modern operating system there are often
hundreds of background processes that need to be occasionally checked. This often
means that a single CPU core will be handling the work of more than one thread.

Each time a CPU core switches focus between programs—or threads of a program—a
small context shift overhead comes into play. Because of this, having too many threads
compared to the number of CPU cores can cause a loss of performance. The constant
context switching will actually make an application slower, so applications should attempt
to reduce the number of threads clamoring for attention from the OS. However, having
too few threads can then mean that an application takes too long to do its thing, resulting
in a poor user experience or otherwise wasted hardware.

Another thing to keep in mind is that if an application makes a thread pool with four
workers, then the minimum number of threads that application is using is five because the
main thread of the application also comes into play. There are also background threads to
consider, like the libuv thread pool, a garbage collection thread if the JavaScript engine
employs one, the thread used to render the browser chrome, and so on. All of these will
affect the performance of the application.

Once you have determined the number of threads to use, you’re ready to determine how
to dispatch work to the workers.

### Dispatch Strategies

Because the goal of a thread pool is to maximize the work that can be done in parallel, it
stands to reason that no single worker should get too much work to handle and no threads
should be sitting there idle without work to do. A naive approach might be to just collect
tasks to be done, then pass them in once the number of tasks ready to be performed
meets the number of worker threads and continue once they all complete. However, each
task isn’t guaranteed to take the same amount of time to complete. It could be that some
are very fast, taking milliseconds, and others may be slow, taking seconds or longer. A
more robust solution must therefore be built.

A few strategies are often employed by applications to dispatch tasks to workers in a
worker pool. These strategies draw parallels to those used by reverse proxies for the
purpose of sending requests to backend services.

The most common strategies are:

Round robin

- Each task is given to the next worker in the pool, wrapping around to the beginning
  once the end has been hit. So, with a pool size of three, the first task goes to Worker 1,
  then Worker 2, then Worker 3, then back to Worker 1, and so on. The benefit of this is
  that each thread gets the exact same number of tasks to perform, but the drawback is
  that if the complexities of each task is a multiple of the number of threads (like each
  6th task takes a long time to perform), then there will be an unfair distribution of work.
  The HAProxy reverse proxy refers to this as roundrobin.

Random

- Each task is assigned to a random worker in the pool. Although this is the simplest to
  build, being entirely stateless, it can also mean that some of the workers are
  sometimes given too much work to perform, and others will sometimes be given too
  little work to perform.

Least busy

- A count of the number of tasks being performed by each worker is maintained, and
  when a new task comes along it is given to the least busy worker. This can even be
  extrapolated so that each worker only has a single task to perform at a time. When two
  workers have a tie for the least amount of work, then one can be chosen randomly. This
  is perhaps the most robust approach, especially if each task consumes the same
  amount of CPU, but it does require the most effort to implement. If some tasks use
  fewer resources, such as if a task calls setTimeout(), then it can lead to skew in
  worker workloads. HAProxy refers to this as leastconn.

  Other strategies employed by reverse proxies might have a nonobvious implementation
  that could be made in your applications as well. For example, HAProxy has a strategy for
  load balancing called source, which takes a hash of the client’s IP address and uses that
  to consistently route requests to a single backend. An equivalent to this might be useful in
  cases where worker threads maintain an in-memory cache of data- and routing-related
  tasks to the same worker could result in more cache hits, but such an approach is a little
  harder to generalize.

_Depending on the nature of your application, you may find that one of these strategies offers much better
performance than the others. Again, benchmarking is your friend when it comes to measuring a given
application’s performance._

**Example Implementation**

This example repurposes the existing files from ch2-patterns/ that you created before, but a lot of the error handling has been removed for brevity, and the code
has been made compatible with Node.js. Create a new directory named ch6-thread-pool/

The first file you’ll create is main.js. This is the entrypoint into the application. The
previous version of this code just used a Promise.allSettled() call to add tasks to the
pool, but that’s not all that interesting because it adds everything at the same time.
Instead, this application exposes a web server, and every request then creates a new task
for the thread pool. With this approach, previous tasks might have been completed by the
time the pool is consulted, which then results in more interesting patterns like with a realworld application.

**Example: ch6-thread-pool/main.js**

```jsx
#!/usr/bin/env node
const http = require("http");
const RpcWorkerPool = require("./rpc-worker.js");
const worker = new RpcWorkerPool(
  "./worker.js",
  Number(process.env.THREADS), //1
  process.env.STRATEGY
); //2
const server = http.createServer(async (req, res) => {
  const value = Math.floor(Math.random() * 100_000_000);
  const sum = await worker.exec("square_sum", value);
  res.end(JSON.stringify({ sum, value }));
});
server.listen(1337, (err) => {
  if (err) throw err;
  console.log("http://localhost:1337/");
});
```

1.- The THREADS environment variable controls the pool size.

2.- The STRATEGY environment variable sets the dispatch strategy.

This application used two environment variables to make it easy to experiment with. The
first is named THREADS and will be used to set the number of threads in the thread pool.
The second environment variable is STRATEGY, which can be used to set the thread pool
dispatch strategy. Otherwise, the server isn’t too exciting, as it just uses the built-in http
module. The server listens on port 1337, and any request, regardless of path, triggers the
handler. Each request calls the square_sum command defined in the workers while
passing in a value between 0 and 100 million.

Next, create a file named worker.js, and add the content below

**Example: ch6-thread-pool/worker.js**

```jsx
const { parentPort } = require("worker_threads");
function asyncOnMessageWrap(fn) {
  return async function (msg) {
    parentPort.postMessage(await fn(msg));
  };
}
const commands = {
  async square_sum(max) {
    await new Promise((res) => setTimeout(res, 100));
    let sum = 0;
    for (let i = 0; i < max; i++) sum += Math.sqrt(i);
    return sum;
  },
};
parentPort.on(
  "message",
  asyncOnMessageWrap(async ({ method, params, id }) => ({
    result: await commands[method](...params),
    id,
  }))
);
```

This file isn’t too interesting because it’s essentially a simplified version of the worker.js
file that you previously created. A lot of the error handling was removed to make the code
shorter (feel free to add it back if you like), and the code has also been modified to be
compatible with the Node.js APIs. In this example only a single command remains, namely
square_sum.

Next, create a file named rpc-worker.js. This file is going to be quite large and has been
broken up into smaller sections. First, add the content below

**Example: ch6-thread-pool/rpc-worker.js (part 1)**

```jsx
const { Worker } = require('worker_threads');
const CORES = require('os').cpus().length;
const STRATEGIES = new Set([ 'roundrobin', 'random', 'leastbusy' ]);
module.exports = class RpcWorkerPool {
 constructor(path, size = 0, strategy = 'roundrobin') {
 if (size === 0) this.size = CORES;//1
 else if (size < 0) this.size = Math.max(CORES + size, 1);
 else this.size = size;
 if (!STRATEGIES.has(strategy)) throw new TypeError('invalid strategy');
 this.strategy = strategy;//2
 this.rr_index = -1;
 this.next_command_id = 0;
 this.workers = [];//3
 for (let i = 0; i < this.size; i++) {
 const worker = new Worker(path);
 this.workers.push({ worker, in_flight_commands: new Map() });//4
 worker.on('message', (msg) => {
 this.onMessageHandler(msg, i);
 });
 }
 }
```

1.- The thread pool size is highly configurable.

2.- The strategy is validated and stored.

3.- An array of workers is maintained instead of just one.

4.- The in_flight_commands list is now maintained per worker.

This file starts off by requiring the worker_threads core module to create workers, as
well as the os module to get the number of available CPU cores. After that the
RpcWorkerPool class is defined and exported. Next, the constructor for the class is
provided. The constructor takes three arguments, with the first being the path to the
worker file, the second being the size of the pool, and the third being the strategy to use.

The pool size is highly configurable and allows the caller to provide a number. If the
number is positive, then it is used as the size of the pool. The default value is zero, and if
provided, the number of CPU cores is used for the pool size. If a negative number is
provided, then that number is subtracted from the number of available cores and that is
used instead. So, on an 8 core machine, passing in a pool size of –2 would result in a pool
size of 6.

The strategy argument may be one of roundrobin (the default), random, or leastbusy.
The value is validated before being assigned to the class. The rr_index value is used as
the round robin index and is a number that cycles through the next available worker ID.

The next_command_id is still global across all threads, so the first command will be 1 and
the next will be 2, regardless of whether the commands are both handled by the same
worker thread or not.

Finally, the workers class property is an array of workers instead of the previous singular
worker property. The code to handle it is largely the same, but the in_flight_commands
list is now local to the individual workers, and the ID of the worker is passed as an
additional argument to the onMessageHandler() method. This is because the individual
worker will later need to be looked up when a message is sent back to the main process.

Continue editing the file by adding the content below

**Example: ch6-thread-pool/rpc-worker.js (part 3)**

```jsx
exec(method, ...args) {
 const id = ++this.next_command_id;
 let resolve, reject;
 const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
 const worker = this.getWorker();//1
 worker.in_flight_commands.set(id, { resolve, reject });
 worker.worker.postMessage({ method, params: args, id });
 return promise;
 }
```

1.- The applicable worker is looked up.

This chunk of the file defines the exec() method, which is what the application calls when
it wants to execute a command in one of the workers. Again, it’s largely unchanged, but
this time it calls the getWorker() method to get the appropriate worker to handle the
next command, instead of working with a single default worker.

**Example: ch6-thread-pool/rpc-worker.js (part 4)**

```jsx
getWorker() {
 let id;
 if (this.strategy === 'random') {
 id = Math.floor(Math.random() * this.size);
 } else if (this.strategy === 'roundrobin') {
 this.rr_index++;
 if (this.rr_index >= this.size) this.rr_index = 0;
 id = this.rr_index;
 } else if (this.strategy === 'leastbusy') {
 let min = Infinity;
 for (let i = 0; i < this.size; i++) {
 let worker = this.workers[i];
 if (worker.in_flight_commands.size < min) {
 min = worker.in_flight_commands.size;
 id = i;
 }
 }
 }
 console.log('Selected Worker:', id);
 return this.workers[id];
 }
};
```

This final chunk of the file defines a final, new method named getWorker(). This method
considers the strategy that was defined for the class instance when determining which
worker to use next. The bulk of the function is a large if statement where each branch
correlates to a strategy.

The first one, random, doesn’t require any additional state, making it the simplest. All the
function does is to randomly choose one of the entries in the pool and then choose that as
a candidate.

The second branch, for roundrobin, is slightly more complicated. This one makes use of a
class property named rr_index, incrementing the value and then returning the worker
located at the new index. Once the index exceeds the number of workers, it then wraps
back around to zero.

The final branch, for leastbusy, has the most complexity. It works by looping through
each one of the workers, noting the number of commands that it currently has in progress
by looking at the size of the in_flight_commands map, and determining if it’s the smallest
value that has been encountered so far. If so, it then decides that worker is the next to be
used. Note that this implementation will stop at the first matching worker with the lowest
number of in-flight commands; so the first time it runs it will always choose worker 0. A
more robust implementation might look at all of the candidates with the lowest, equal
commands, and choose one randomly.

Now that your application has been prepared, you’re ready to execute it. Open up two
terminal windows and navigate to the ch6-thread-pool/ directory in the first one. In this
terminal window execute the following command:

```
$ THREADS=3 STRATEGY=leastbusy node main.js
```

This starts a process with a thread pool containing three workers using the leastbusy
strategy.

Next, run the following command in the second terminal window:

```
$ npx autocannon -c 5 -a 20 http://localhost:1337
```

This executes the autocannon command, which is an npm package for performing
benchmarks. In this case, though, you’re not actually running a benchmark, but you’re
instead just running a whole bunch of queries. The command is configured to open five
connections at a time and send a total of 20 requests. Essentially, this will make 5
requests seemingly in parallel, then as the requests are closed the remaining 15 requests
will be made. This is akin to a production web server you might build.

Since the application is using the leastbusy strategy, and because the code is written to
choose the first process with the fewest commands, the first five requests should then
essentially be treated as round robin. With a pool size of three, when the application first
runs, each worker has zero tasks. So the code first elects to use Worker 0. For the second
request, the first worker has one task while the second and third worker have zero, so the
second is chosen. Then the third. For the fourth, each of the three workers is consulted,
each having one task, and so the first is chosen again.

After the first five tasks are assigned, the remaining worker assignments are essentially
random, as each command takes essentially a random amount of time to succeed.

Next, kill the server using Ctrl+C, and then run it again using the roundrobin strategy:

```
$ THREADS=3 STRATEGY=roundrobin node main.js
```

Run the same autocannon command as before in the second terminal. This time you
should see that the tasks are always executed in the order of 0, 1, 2, 0, and so on.

Finally, kill the server with Ctrl+C again, and run it again with the random strategy:

```
$ THREADS=3 STRATEGY=random node main.js
```

Run the autocannon command a final time and note the results. This time it should be
entirely random. If you notice the same worker getting chosen multiple times in a row, it
likely means that worker is overloaded.

## Mutex: A Basic Lock

A mutually exclusive lock, or mutex, is a mechanism for controlling access to some shared
data. It ensures that only one task may use that resource at any given time. Here, a task
can mean any sort of concurrent task, but most often the concept is used when working
with multiple threads, to avoid race conditions. A task acquires the lock in order to run
code that accesses the shared data, and then releases the lock once it’s done. The code
between the acquisition and the release is called the critical section. If a task attempts to
acquire the lock while another task has it, that task will be blocked until the other task
releases the lock.

It may not be obvious why you might want to use a mutex when we have atomic
operations at our disposal through the Atomics object.

It turns out that code often requires that data not be modified
externally across more than one operation. Put another way, the units of atomicity
provided by atomic operations are too small for many algorithms’ critical sections.

_For
example, two integers may be read from several parts of shared memory, then summed up
to be written to another part. If values are changed in between the two retrievals, the sum
will reflect values from two different tasks, which can lead to logic errors later on in the
program._

Let’s look at an example program that initializes a buffer with a bunch of numbers and
performs some basic math on them in several threads. We’ll have each thread grab a
value at a unique index per thread, then grab a value from a shared index, multiply those
together, and write them at the shared index. Then we’ll read from that shared index and
check that it’s equal to the product of the previous two reads. In between the two reads,
we’ll perform a busy loop to simulate doing some other work that takes some time.

**Example: ch6-mutex/thread-product.js**

```jsx
const { Worker, isMainThread, workerData } = require("worker_threads");
const assert = require("assert");
if (isMainThread) {
  const shared = new SharedArrayBuffer(4 * 4); //1
  const sharedInts = new Int32Array(shared);
  sharedInts.set([2, 3, 5, 7]);
  for (let i = 0; i < 3; i++) {
    new Worker(__filename, { workerData: { i, shared } });
  }
} else {
  const { i, shared } = workerData;
  const sharedInts = new Int32Array(shared);
  const a = Atomics.load(sharedInts, i);
  for (let j = 0; j < 1_000_000; j++) {}
  const b = Atomics.load(sharedInts, 3);
  Atomics.store(sharedInts, 3, a * b);
  assert.strictEqual(Atomics.load(sharedInts, 3), a * b); //2
}
```

1.- We’ll be using three threads and an Int32Array to hold the data, so we need it big
enough to hold three 32-bit integers, plus a fourth to be the shared multiplier/result.

2.- Here, we’re checking our work. In a real-world application, there likely would be no
check here, but this simulates depending on the result to perform other actions, which
may happen later on in the program

You can run this example as follows:

```
$ node thread-product.js
```

You might find that on the first try, or even the first bunch of tries, this works fine, but go
ahead and keep running it. Alternatively you may find that the assertion fails immediately.
At some point, within the first 20 or so attempts, you should see that the assertion fails.
While we’re using atomic operations, we’re using four of them, and between any of these,
some change can occur in these values. This is a classic example of a race condition. All
the threads are reading and writing concurrently (though not in parallel, since the
operations themselves are atomic), so the results aren’t deterministic for given input
values.

To solve this, we’ll implement a Mutex class using the primitives we have in Atomics. We’ll
be making use of Atomics.wait() to wait until the lock can be acquired, and
Atomics.notify() to notify threads that the lock has been released. We’ll use
Atomics.compareExchange() to swap the locked/unlocked state and determine whether
we need to wait to get the lock.

**Example: ch6-mutex/mutex.js (part 1)**

```jsx
const UNLOCKED = 0;
const LOCKED = 1;
const {
 compareExchange, wait, notify
} = Atomics;
class Mutex {
 constructor(shared, index) {
 this.shared = shared;
 this.index = index;
 }
```

Here we’ve defined our LOCKED and UNLOCKED states as 1 and 0, respectively. Really, they
can be any values that fit in the TypedArray we pass into the Mutex constructor, but
sticking with 1 and 0 makes it easier to think about as a boolean value. We have set up the
constructor to take in two values that will be assigned to properties: the TypedArray we’ll
be operating on, and the index in that array that we’ll use as the lock status. Now, we’re
ready to start using Atomics to add the acquire() method, which uses the destructured
Atomics. Add the acquire() method as below

**Example: ch6-mutex/mutex.js (part 2)**

```jsx
acquire() {
 if (compareExchange(this.shared, this.index, UNLOCKED, LOCKED) === UNLOCKED) {
 return;
 }
 wait(this.shared, this.index, LOCKED);
 this.acquire();
 }
```

To acquire a lock, we make an attempt to swap the UNLOCKED state for the LOCKED state at
the mutex’s array index, using Atomics.compareExchange(). If the swap is successful,
then there’s nothing left to do and we’ve acquired the lock, so we can just return.
Otherwise we need to wait for unlocking, which in this case means waiting for notification
that the value change from LOCKED to anything else. Then we make another attempt to
acquire the lock. We’re doing this through recursion here to illustrate the “retry” nature
of the operation, but it could just as easily be a loop. It should work on the second time
through since we’ve specifically waited for it to become unlocked, but in between the
wait() and the compareExchange(), the value may have changed, so we need to check
again. In a real-world implementation, you might want to both add a timeout on the
wait() and limit the number of attempts that can be made.

_Note:
In many production mutex implementations, in addition to the “unlocked” and “locked” states, you’ll often
find a state meaning “locked and contended.” Contention arises when one thread attempts to acquire a lock
that’s already held by another thread. By keeping track of this state, the mutex code can avoid using extra
notify() calls, allowing for better performance._

### SEMAPHORES

The element in the shared array that we use to represent the state of being locked or
unlocked is a trivial example of a semaphore. Semaphores are variables used to convey
state information between threads. They indicate a count of a resource being used. In
the case of a mutex, we limit this to 1, but semaphores in other scenarios may involve
other limits for other purposes.

Now we’ll look at releasing a lock. Add the release() method shown below

**Example: ch6-mutex/mutex.js (part 3)**

```jsx
release() {
 if (compareExchange(this.shared, this.index, LOCKED, UNLOCKED) !== LOCKED) {
 throw new Error('was not acquired');
 }
 notify(this.shared, this.index, 1);
 }
```

e’re using Atomics.compareExchange() to swap the locked state again, much as
we did to acquire the lock. This time, we want to make sure that the original state was
indeed LOCKED since we don’t want to release the lock if we haven’t acquired it. The only
thing left to do at this point is to notify(), enabling a waiting thread (if there is one) to
acquire the lock. We set the count for notify() to 1, because there’s no need to wake
more than one sleeping thread, since only one can ever hold the lock at one time.

What we have now is enough to work as a serviceable mutex lock. However, it’s relatively
easy to acquire a lock and forget to release it, or in some other way have an unexpected
critical section. For many use cases, the critical section is well-defined and knowable
ahead of time. In those cases, it makes sense to have a helper method on the Mutex class
to wrap critical sections with ease. Let’s do exactly that by adding the exec() method below

**Example: ch6-mutex/mutex.js (part 4)**

```jsx
exec(fn) {
 this.acquire();
 try {
 return fn();
 } finally {
 this.release();
 }
 }
}
module.exports = Mutex;
```

All we’re doing here is calling the passed-in function and returning its value, but
wrapping that with an acquire() beforehand and release() afterward. This way the
passed-in function contains all the code of our critical section. Note that we call the
passed-in function inside a try block, with the release() happening in the corresponding
finally. Since the passed-in function could throw an exception, we want to make sure
that we release the lock even in that scenario. This completes our Mutex class, so now we
can move on to using it in our example.

Make a copy of thread-product.js in the same directory, called thread-product-mutex.js. In
that file require the mutex.js file and assign it to a const called Mutex. Add another 4
bytes to the SharedArrayBuffer (e.g., new SharedArrayBuffer(4 \* 5)) for our lock to
use, then replace everything in the else block with the content below

**Example: ch6-mutex/thread-product-mutex.js**

```jsx
const { i, shared } = workerData;
const sharedInts = new Int32Array(shared);
const mutex = new Mutex(sharedInts, 4); //1
mutex.exec(() => {
  const a = sharedInts[i]; //2
  for (let j = 0; j < 1_000_000; j++) {}
  const b = sharedInts[3];
  sharedInts[3] = a * b;
  assert.strictEqual(sharedInts[3], a * b);
});
```

1.- Before this line, everything’s the same as when we weren’t using the mutex. Now, we’ll
initialize one, using the fifth element of our Int32Array as our lock data.

2.- Inside the function passed to exec(), we’re in our critical section, which is protected
by the lock. This means we don’t need atomic operations to read or manipulate the
array. Instead, we can just operate on it like any other TypedArray.

In addition to enabling ordinary array access techniques, the mutex has allowed us to
ensure that no other thread is able to modify these pieces of data while we’re looking at
them. Because of that, our assertion would never fail. Give it a try! Run the following
command to run this example, and even run it tens, hundreds, or even thousands of times.
It will never fail the assertion like the version using only atomics did:

```
$ node thread-product-mutex.js
```

_NOTE
Mutexes are straightforward tools to lock access to a resource. They allow critical sections to operate without
interference from other threads. They are one example of how we can leverage combinations of atomic
operations to make new building blocks for multithreaded programming._

## Streaming Data with Ring Buffers

Many applications involve streaming data. For example, HTTP requests and responses are
usually presented via HTTP APIs as sequences of byte data coming in as chunks as they
are received. In network applications, data chunks are size-constrained by packet sizes. In
filesystem applications, data chunks can be size-constrained by kernel buffer sizes. Even if
we output data to these resources without any regard for streaming, the kernel will break
the data up into chunks in order to send it to its destination in a buffered manner.

Streaming data also occurs in user applications and can be used as a way to transfer
larger amounts of data between computation units, like processes or threads. Even
without separate computation units, you may want or need to hold data in some kind of
buffer before processing it. This is where ring buffers, also known as circular buffers,
come in handy.

A ring buffer is an implementation of a first-in-first-out (FIFO) queue, implemented using
a pair of indices into an array of data in memory. Crucially, for efficiency, when data is
inserted into the queue, it won’t ever move to another spot in memory. Instead, we move
the indices around as data gets added to or removed from the queue. The array is treated
as if one end is connected to the other, creating a ring of data. This means that if these
indices are incremented past the end of the array, they’ll go back to the beginning.

An analog in the physical world is the restaurant order wheel, commonly found in North
American diners. In restaurants using this kind of system, the wheel is usually placed in a
part of the restaurant that divides the customer-facing area from the kitchen. Orders are
taken from the customers on note papers, which are then inserted into the wheel in order.
Then, on the kitchen side, the cooks can grab orders off the wheel in the same order so
that food is cooked in the appropriate order, and no customer is left waiting too long for
their food. This is a bounded FIFO queue, just like our ring buffers. Indeed, it’s also
literally circular!

To implement a ring buffer, we’ll need the two indices, head and tail. The head index
refers to the next position to add data into the queue, and the tail index refers to the
next position to read data out of the queue from. When data is written to or read from the
queue, we increase the head or tail index, respectively, by the amount of data written or
read, modulo the size of the buffer

Let’s make an implementation of a ring buffer. We’ll start off not worrying about threads,
but to make our lives easier later on, we’ll store head and tail as well as the current
length of the queue in a TypedArray. We could try just using the difference between head
and tail as the length, but that leaves us with an ambiguous case, where we can’t tell if
the queue is empty or full when the head and tail are the same value, so we’ll have a
separate value for length. We’ll start by setting up the constructor and acessors, by
adding the content below

**Example: ch6-ring-buffer/ring-buffer.js (part 1)**

```jsx
class RingBuffer {
 constructor(meta/*: Uint32Array[3]*/, buffer /*: Uint8Array */) {
 this.meta = meta;
 this.buffer = buffer;
 }
 get head() {
 return this.meta[0];
 }
 set head(n) {
 this.meta[0] = n;
 }
 get tail() {
 return this.meta[1];
 }
 set tail(n) {
 this.meta[1] = n;
 }
 get length() {
 return this.meta[2];
 }
 set length(n) {
 this.meta[2] = n;
 }
```

The constructor takes in a three-element Uint32Array called meta, which we’ll use for our
head, tail, and length. For convenience, we’ve also added those properties as getters
and setters, which internally just access those array elements. It also takes in a
Uint8Array that will be the backing storage for our ring buffer. Next, we’ll add the
write() method. Add the method as defined below

**Example: ch6-ring-buffer/ring-buffer.js (part 2)**

```jsx
write(data /*: Uint8Array */) {//1
 let bytesWritten = data.length;
 if (bytesWritten > this.buffer.length - this.length) {//2
 bytesWritten = this.buffer.length - this.length;
 data = data.subarray(0, bytesWritten);
 }
 if (bytesWritten === 0) {
 return bytesWritten;
 }
 if (
 (this.head >= this.tail && this.buffer.length - this.head >= bytesWritten) ||
 (this.head < this.tail && bytesWritten <= this.tail - this.head)//3
 ) {
 // Enough space after the head. Just write it in and increase the head.
 this.buffer.set(data, this.head);
 this.head += bytesWritten;
 } else {//4
 // We need to split the chunk into two.
 const endSpaceAvailable = this.buffer.length - this.head;
 const endChunk = data.subarray(0, endSpaceAvailable);
 const beginChunk = data.subarray(endSpaceAvailable);
 this.buffer.set(endChunk, this.head);
 this.buffer.set(beginChunk, 0);
 this.head = beginChunk.length;
 }
 this.length += bytesWritten;
 return bytesWritten;
 }
```

1.- In order for this code to work correctly, data needs to be an instance of the same
TypedArray as this.buffer. This can be checked via static type checking, or with an
assertion, or both.

2.- If there’s not enough space in the buffer for all the data to be written, we’ll write as
many bytes as we can to fill the buffer and return the number of bytes that were
written. This notifies whoever is writing the data that they’ll need to wait for some of
the data to be read out of it before continuing to write.

3.- This conditional represents when we have enough contiguous space to write the data.
This happens when either the head is after the tail in the array and the space after the
head is bigger than the data to write, or when the head is before the tail and there’s
enough space between the tail and the head. For either of these conditions, we can just
write the data to the array and increase the head index by the length of the data.

4.- On the other side of that if block, we need to write data until the end of the array and
then wrap it around to write at the beginning of the array. This means splitting the
data into a chunk to write at the end and a chunk to write at the beginning, and writing
them accordingly. We’re using subarray() rather than slice() to chop up the data to
avoid unnecessary secondary copy operations.

Writing turns out to be just a matter of copying the bytes over using set() and changing
the head index appropriately, with a special case for when the data is split across the
boundaries of the array. Reading is very similar, as shown in the read() method below

**Example: ch6-ring-buffer/ring-buffer.js (part 3)**

```jsx
read(bytes) {
 if (bytes > this.length) {//1
 bytes = this.length;
 }
 if (bytes === 0) {
 return new Uint8Array(0);
 }
 let readData;
 if (
 this.head > this.tail || this.buffer.length - this.tail >= bytes//2
 ) {
 // The data is in a contiguous chunk.
 readData = this.buffer.slice(this.tail, bytes)
 this.tail += bytes;
 } else {//3
 // Read from the end and the beginning.
 readData = new Uint8Array(bytes);
 const endBytesToRead = this.buffer.length - this.tail;
 readData.set(this.buffer.subarray(this.tail, this.buffer.length));
 readData.set(this.buffer.subarray(0, bytes - endBytesToRead), endBytesToRead);
 this.tail = bytes - endBytesToRead;
 }
 this.length -= bytes;
 return readData;
 }
}
```

1.- The input to read() is the number of bytes requested. If there aren’t enough bytes in
the queue, it will instead return all the bytes currently in the queue.

2.- If the requested data is in a contiguous chunk reading from the tail, we’ll just give
that directly to the caller using slice() to get a copy of those bytes. We’ll move the
tail to the end of the returned bytes.

3.- In the else case, the data is split across the boundaries of the array, so we need to get
both chunks and stitch them together in reverse order. To do that, we’ll allocate a big
enough Uint8Array, then copy the data from the beginning and end of the array. The
new tail is set to the end of the chunk at the beginning of the array.

When reading bytes out of the queue, it’s important to copy them out, rather than just
refer to the same memory. If we don’t, then other data written to the queue might end up
in these arrays at some time in the future, which is something we don’t want. That’s why
we use slice() or a new Uint8Array for the returned data.

At this point, we have a working single-threaded bounded queue, implemented as a ring
buffer. If we wanted to use it with one thread writing (the producer) and one thread
reading (the consumer), we could use a SharedArrayBuffer as the backing storage for
the inputs to constructor, pass that to another thread, and instantiate it there as well.
Unfortunately, we haven’t yet used any atomic operations or identified and isolated
critical sections using locks, so if multiple threads use the buffer, we can end up with race
conditions and bad data

The read and write operations assume that none of the head, tail, or length are going to
change by other threads throughout the operation. We may be able to get more specific
than that later on, but being this general to start will at least give us the thread safety we
need to avoid race conditions. We can use the Mutex class from “Mutex: A Basic Lock” to
identify critical sections and make sure they’re only executed one at a time.

Let’s require the Mutex class and add the wrapper class in Example 6-16 to the file that
will make use of our existing RingBuffer class.

**Example: ch6-ring-buffer/ring-buffer.js (part 4)**

```jsx
const Mutex = require("../ch6-mutex/mutex.js");
class SharedRingBuffer {
  constructor(shared /*: number | SharedArrayBuffer*/) {
    this.shared =
      typeof shared === "number" ? new SharedArrayBuffer(shared + 16) : shared;
    this.ringBuffer = new RingBuffer(
      new Uint32Array(this.shared, 4, 3),
      new Uint8Array(this.shared, 16)
    );
    this.lock = new Mutex(new Int32Array(this.shared, 0, 1));
  }
  write(data) {
    return this.lock.exec(() => this.ringBuffer.write(data));
  }
  read(bytes) {
    return this.lock.exec(() => this.ringBuffer.read(bytes));
  }
}
```

To start it off, the constructor accepts or creates the SharedArrayBuffer. Notice that we
add 16 bytes to the size of the buffer to handle both the Mutex, which needs a one-element
Int32Array, and the RingBuffer metadata, which needs a three-element Uint32Array.

The read() and write() operations are wrapped with the exec() method from the Mutex.
Recall that this prevents any other critical sections protected by the same mutex from
running at the same time.

To see this data structure in action, let’s create some producer and consumer threads.
We’ll set up a SharedRingBuffer with 100 bytes to work with. The producer threads will
write the string "Hello, World!\n" to the SharedRingBuffer, repeatedly, as fast as they
can acquire the lock. The consumer threads will attempt to read 20 bytes at a time, and
we’ll log how many bytes they were able to read.

**Example: ch6-ring-buffer/ring-buffer.js (part 5)**

```jsx
const { isMainThread, Worker, workerData } = require("worker_threads");
const fs = require("fs");
if (isMainThread) {
  const shared = new SharedArrayBuffer(116);
  const threads = [
    new Worker(__filename, { workerData: { shared, isProducer: true } }),
    new Worker(__filename, { workerData: { shared, isProducer: true } }),
    new Worker(__filename, { workerData: { shared, isProducer: false } }),
    new Worker(__filename, { workerData: { shared, isProducer: false } }),
  ];
} else {
  const { shared, isProducer } = workerData;
  const ringBuffer = new SharedRingBuffer(shared);
  if (isProducer) {
    const buffer = Buffer.from("Hello, World!\n");
    while (true) {
      ringBuffer.write(buffer);
    }
  } else {
    while (true) {
      const readBytes = ringBuffer.read(20);
      fs.writeSync(1, `Read ${readBytes.length} bytes\n`); //1
    }
  }
}
```

1.- You might notice that we’re not using console.log() to write our byte counts to
stdout and instead using a synchronous write to the file descriptor corresponding to
stdout. This is because we’re using an infinite loop without any await inside. We’re
starving the Node.js event loop, so with console.log or any other asynchronous
logger, we’d never actually see any output.

You can run this example with Node.js as follows:

```
$ node ring-buffer.js
```

The output produced by this script will show the number of bytes read in each iteration in
each consumer thread. Because we’re asking for 20 bytes each time, you’ll see that as the
maximum number read. You’ll see all zeros sometimes when the queue is empty. You’ll see
other numbers when the queue is partially full.

### LOCK-FREE QUEUES

Our implementation of a ring buffer may be functionally sound, but it isn’t the most
efficient. In order to perform any operation on the data, all other threads are blocked
from accessing the data. While this may be the simplest approach, solutions without
using locks do exist, which instead take advantage of carefully used atomic operations
for synchronization. The trade-off here is complexity.

## Actor Model

The actor model is a programming pattern for performing concurrent computation that
was first devised in the 1970s. With this model an actor is a primitive container that
allows for executing code. An actor is capable of running logic, creating more actors,
sending messages to other actors, and receiving messages.

These actors communicate with the outside world by way of message passing; otherwise,
they have their own isolated access to memory. An actor is a first-class citizen in the
Erlang programming language, but it can certainly be emulated using JavaScript.

The actor model is designed to allow computations to run in a highly parallelized manner
without necessarily having to worry about where the code is running or even the protocol
used to implement the communication. Really, it should be transparent to program code
whether one actor communicates with another actor locally or remotely.

### Pattern Nuances

Actors are able to process each message, or task, that they receive one at a time. When
these messages are first received, they sit in a message queue, sometimes referred to as a
mailbox. Having a queue is convenient because if two messages were received at once
then they both shouldn’t be processed at the same time. Without a queue, one actor might
need to check if another actor is ready before sending a message, which would be a very
tedious process.

Although no two actors are able to write to the same piece of shared memory, they are
free to mutate their own memory. This includes maintaining state modifications over time.

## Relating to JavaScript

The actors that exist as first-class citizens in languages such as Erlang can’t be perfectly
reproduced using JavaScript, but we can certainly try. There are likely dozens of ways to
draw parallels and implement actors, and this section exposes you to one of them.

One draw of the actor model is that actors don’t need to be limited to a single machine.
This means that processes can run on more than one machine and communicate over the
network. We can implement this using Node.js processes, each communicating using
JSON via the TCP protocol.

Because individual actors should be able to run code in parallel with other actors, and
each actor processes only a single task at a time, it then stands to reason that actors
should probably run on different threads to maximize system usage. One way to go about
this is to instantiate new worker threads. Another way would be to have dedicated
processes for each actor, but that would use more resources.

Because there is no need to deal with shared memory between the different actors, the
SharedArrayBuffer and Atomics objects can be largely ignored (though a more robust
system might rely on them for coordination purposes).

Actors require a message queue so that while one message is being processed another
message can wait until the actor is ready. JavaScript workers sort of handle this for us
using the postMessage() method. Messages delivered in this manner wait until the
current JavaScript stack is complete before grabbing the next message. If each actor is
only running synchronous code, then this built-in queue can be used. On the other hand, if
actors can perform asynchronous work, then a manual queue will need to be built instead.

### Example Implementation

Create a new directory named ch6-actors/ for this implementation. Inside this directory,
copy and paste the existing ch6-thread-pool/rpc-worker.js file

Those files will be used as the basis of
the thread pool in this example and can remain unchanged.
Next, create a file named ch6-actors/server.js and add the content from below

**Example: ch6-actors/server.js (part 1)**

```jsx
#!/usr/bin/env node
const http = require("http");
const net = require("net");
const [, , web_host, actor_host] = process.argv;
const [web_hostname, web_port] = web_host.split(":");
const [actor_hostname, actor_port] = actor_host.split(":");
let message_id = 0;
let actors = new Set(); // collection of actor handlers
let messages = new Map(); // message ID -> HTTP response
```

This file creates two server instances. The first is a TCP server, a rather basic protocol,
while the second is an HTTP server, which is a higher-level protocol based on TCP, though
the two server instances won’t depend on each other. The first part of this file contains
boilerplate for accepting command-line arguments to configure the two servers.

The message_id variable contains a number that will increment as each new HTTP
request is made. The messages variable contains a mapping of message IDs to response
handlers that will be used to reply to the messages. This is the same pattern that you used
in “Thread Pool”. Finally, the actors variable contains a collection of handler functions
that are used to send messages to external actor processes.

Next add the content below

**Example: ch6-actors/server.js (part 2)**

```jsx
net
  .createServer((client) => {
    const handler = (data) => client.write(JSON.stringify(data) + "\0"); //1
    actors.add(handler);
    console.log("actor pool connected", actors.size);
    client
      .on("end", () => {
        actors.delete(handler); //2
        console.log("actor pool disconnected", actors.size);
      })
      .on("data", (raw_data) => {
        const chunks = String(raw_data).split("\0"); //3
        chunks.pop(); //4
        for (let chunk of chunks) {
          const data = JSON.parse(chunk);
          const res = messages.get(data.id);
          res.end(JSON.stringify(data) + "\0");
          messages.delete(data.id);
        }
      });
  })
  .listen(actor_port, actor_hostname, () => {
    console.log(`actor: tcp://${actor_hostname}:${actor_port}`);
  });
```

1.- A null byte '\0' is inserted between messages.

2.- When a client connection is closed, it is removed from the actors set.

3.- The data events may contain multiple messages and are split on null bytes.

4.- The final byte is a null byte, so the last entry in chunks is an empty string.

This file creates the TCP server. This is how dedicated actor processes will connect to the
main server process. The net.createServer() callback is called each time an actor
process connects. The client argument represents a TCP client, essentially a connection
to the actor process. A message is logged each time a connection is made, and a handler
function for conveniently messaging the actor is added to the actors collection.

When a client disconnects from the server, that client’s handler function is deleted from
the actors collection. Actors communicate with the server by sending messages over TCP, which triggers the data event

The messages they send are JSON-encoded data. This
data contains an id field which correlates to the message ID. When the callback is run,
the correlating handler function is retrieved from the messages map. Finally, the response
message is sent back to the HTTP request, the message is removed from the messages
map, and the server listens on the specified interface and port.

_NOTE
The connection between the server and the actor pool client is a long-lived connection. That is why event
handlers are set up for things like the data and end events._

Notably missing from this file is an error handler for the client connection. Since it’s
missing, a connection error will cause the server process to terminate. A more robust
solution would delete the client from the actors collection.

The '\0' null bytes are inserted between messages because when one side emits a
message it’s not guaranteed to arrive in a single data event on the other side. Notably, when multiple messages are sent in quick succession, they will arrive in a single data
event. This is a bug you won’t encounter while making single requests with curl, but that
you would encounter when making many requests with autocannon. This results in
multiple JSON documents concatenated together, like so: {"id":1…}{"id":2…}. Passing
that value into JSON.parse() results in an error. The null bytes cause the events to
resemble this: {"id":1…}\0{"id":2…}\0. The string is then split on the null byte and each
segment is parsed separately. If a null byte were to appear in a JSON object, it would be
escaped, meaning it’s safe to use a null byte to separate JSON documents.

**Example: ch6-actors/server.js (part 3)**

```jsx
http
  .createServer(async (req, res) => {
    message_id++;
    if (actors.size === 0) return res.end("ERROR: EMPTY ACTOR POOL");
    const actor = randomActor();
    messages.set(message_id, res);
    actor({
      id: message_id,
      method: "square_sum",
      args: [Number(req.url.substr(1))],
    });
  })
  .listen(web_port, web_hostname, () => {
    console.log(`web: http://${web_hostname}:${web_port}`);
  });
```

This part of the file creates an HTTP server. Unlike the TCP server, each request
represents a short-lived connection. The http.createServer() callback is called once for
each HTTP request that is received.

Inside this callback the current message ID is incremented and the list of actors is
consulted. If it’s empty, which can happen when the server starts but an actor hasn’t
joined, an error message “ERROR: EMPTY ACTOR POOL” is returned. Otherwise, if actors
are present, a random one is then chosen

Next, a JSON message is sent to the actor. The message contains an id field which
represents the message ID, a method field which represents the function to be called
(always square_sum in this case), and finally the list of arguments. In this case the HTTP
request path contains a slash and a number, like /42, and the number is extracted to be
used as the argument. Finally, the server listens on the provided interface and port.

**Example: ch6-actors/server.js (part 4)**

```jsx
function randomActor() {
  const pool = Array.from(actors);
  return pool[Math.floor(Math.random() * pool.length)];
}
```

This part of the file just grabs a random actor handler from the actors list.
With this file complete (for now), create a new file named ch6-actors/actor.js. This file
represents a process that doesn’t provide a server, but instead will connect to the other
server process.

**Example: ch6-actors/actor.js (part 1)**

```jsx
#!/usr/bin/env node
const net = require("net");
const RpcWorkerPool = require("./rpc-worker.js");
const [, , host] = process.argv;
const [hostname, port] = host.split(":");
const worker = new RpcWorkerPool("./worker.js", 4, "leastbusy");
```

Again, this file starts off with some boilerplate to extract the hostname and port
information for the server process. It also initializes a thread pool using the
RpcWorkerPool class. The pool has a strict size of four threads, which can be thought of
as four actors, and uses the leastbusy algorithm.

**Example: ch6-actors/actor.js (part 2)**

```jsx
const upstream = net
  .connect(port, hostname, () => {
    console.log("connected to server");
  })
  .on("data", async (raw_data) => {
    const chunks = String(raw_data).split("\0"); //1
    chunks.pop();
    for (let chunk of chunks) {
      const data = JSON.parse(chunk);
      const value = await worker.exec(data.method, ...data.args);
      upstream.write(
        JSON.stringify({
          id: data.id,
          value,
          pid: process.pid,
        }) + "\0"
      );
    }
  })
  .on("end", () => {
    console.log("disconnect from server");
  });
```

1.- The actor also needs to handle null byte chunk separation.

The net.connect() method creates a connection to the upstream port and hostname,
which represents the server process, logging a message once the connection succeeds.
When the server sends a message to this actor, it triggers the data event, passing in a
buffer instance as the raw_data argument. This data, containing a JSON payload, is then
parsed.
The actor process then invokes one of its workers, calling the requested method and
passing in the arguments. Once the worker/actor is finished, the data is then sent back to
the server instance

The same message ID is preserved using the id property. This value
must be provided because a given actor process can receive multiple message requests at
the same time and the main server process needs to know which reply correlates with
which request. The returned value is also provided in the message. The process ID is also
provided as metadata in the response assigned to pid so that you can visualize which
program is calculating what data.

Now that your files are complete, you’re ready to run your programs. First, run the server,
providing a hostname and port to use for the HTTP server, followed by a hostname and
port to use for the TCP server. You can do this by running the following command:

```
$ node server.js 127.0.0.1:8000 127.0.0.1:9000
# web: http://127.0.0.1:8000
# actor: tcp://127.0.0.1:9000
```

In this case the process displays the two server addresses.
Next, send a request to the server in a new terminal window:

```
$ curl http://localhost:8000/9999
# ERROR: EMPTY ACTOR POOL
```

In this case the server replied with an error. Since there are no running actor
processes, there is nothing that can execute the work.

run an actor process and give it the hostname and port for the server instance. You
can do that by running the following command:

```
$ node actor.js 127.0.0.1:9000
```

You should see a message printed from both the server and the worker process that a
connection was established. Next, run the curl command again in a separate terminal
window:

```
$ curl http://localhost:8000/99999
# {"id":4,"value":21081376.519967034,"pid":160004}
```

You should get back a similar value to the one printed earlier. With the new actor process
attached, the program went from having zero actors available to perform work to having
four actors. But you don’t need to stop there. In another terminal window run another
instance of the worker using the same command, and issue another curl command:

```
$ node actor.js 127.0.0.1:9000
$ curl http://localhost:8000/8888888
# {"id":4,"value":21081376.519967034,"pid":160005}
```

As you run the command multiple times you should see that the pid value changes in the
response. Congratulations, you’ve now dynamically increased the count of actors available
to your application. This was done at runtime, effectively increasing the performance of
your application without downtime.

one of the benefits of the actor pattern is that it doesn’t really matter where the
code runs. In this case the actors live inside an external process. This allowed the error to
happen when the server was first executed: an HTTP request was made, but an actor
process hadn’t yet connected. One way to fix this is to add some actors to the server
process as well.

**Example: ch6-actors/server.js (part 5, bonus)**

```jsx
const RpcWorkerPool = require("./rpc-worker.js");
const worker = new RpcWorkerPool("./worker.js", 4, "leastbusy");
actors.add(async (data) => {
  const value = await worker.exec(data.method, ...data.args);
  messages.get(data.id).end(
    JSON.stringify({
      id: data.id,
      value,
      pid: "server",
    }) + "\0"
  );
  messages.delete(data.id);
});
```

This addition to the file creates a worker thread pool in the server process, effectively
adding an additional four actors to the pool. Kill the existing server and actor processes
that you’ve created with Ctrl+C. Then, run your new server code and send it a curl
request:

```
$ node server.js 127.0.0.1:8000 127.0.0.1:9000
$ curl http://localhost:8000/8888888
# {"id":8,"value":17667693458.923462,"pid":"server"}
```

In this case the pid value has been hardcoded to server to signify that the process
performing the calculation is the server process. Much like before, you can run some
more actor processes to have them connect to the server and run more curl commands to
send requests to the server. When this happens you should see that requests are handled
either by dedicated actor processes or by the server.

With the actor pattern, you shouldn’t think of the joined actors as external APIs. Instead,
think of them as an extension of the program itself. This pattern can be powerful, and it
comes with an interesting use case. Hot code loading is when newer versions of
application code replaces old versions and is done while the application continues to run.
With the actor pattern you’ve built, you are able to modify the actor.js / worker.js files,
modify the existing square_sum() method, or even add new methods. Then, you can
launch new actor programs and terminate old actor programs, and the main server will
then start using the new actors.
