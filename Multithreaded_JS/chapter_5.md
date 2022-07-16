# Chapter 5. Advanced Shared memory

## Atomic Methods for Coordination

These methods are a little different than the ones that were
already covered in “Atomic Methods for Data
Manipulation”. Specificially, the methods previously
covered each work with a TypedArray of any kind and may
operate on both SharedArrayBuffer and ArrayBuffer
instances

However, the methods listed here will only work
with Int32Array and BigInt64Array instances, and they
only make sense when used with SharedArrayBuffer
instances.

If you try to use these methods with the wrong type of
TypedArray, you’ll get one of these errors:

```
# Firefox v88
Uncaught TypeError: invalid array type for the operation
# Chrome v90 / Node.js v16
Uncaught TypeError: [object Int8Array] is not an int32 or
BigInt64 typed array.
```

As far as prior art goes, these methods are modeled after a
feature available in the Linux kernel called the futex, which
is short for fast userspace mutex. Mutex itself is short for
mutual exclusion, which is when a single thread of
execution gets exclusive access to a particular piece of
data. A mutex can also be referred to as a lock, where one
thread locks access to the data, does its thing, and then
unlocks access, allowing another thread to then touch the
data. A futex is built on two basic operations, one being
“wait” and the other being “wake.”

### Atomics.wait()

```JSX
status = Atomics.wait(typedArray, index, value, timeout =
Infinity)
```

This method first checks typedArray to see if the value at
index is equal to value. If it is not, the function returns the
value not-equal. If the value is equal, it will then freeze
the thread for up to timeout milliseconds. If nothing
happens during that time, the function returns the value
timed-out. On the other hand, if another thread calls
**Atomics.notify()** for that same index within the time
period, the function then returns with a value of ok.

You might be wondering why this method doesn’t throw an
error for the first two conditions and silently succeed
instead of returning an ok. Because multithreaded
programming is used for performance reasons, it stands to
reason that calling these Atomics methods will be done in
the hotpaths of an application, which are areas where the
application spends the most time. It’s less performant in
JavaScript to instantiate Error objects and generate stack
traces than to return a simple string, so the performance of
this approach is pretty high.

Another reason is that the
not-equal case doesn’t really represent an error case but
that something you’re waiting for has already happened.

### Atomics.notify()

```JSX
awaken = Atomics.notify(typedArray, index, count = Infinity)
```

The Atomics.notify() method attempts to awaken other
threads that have called Atomics.wait() on the same
typedArray and at the same index. If any other threads are
currently frozen, then they will wake up. Multiple threads
can be frozen at the same time, each waiting to be notified.

The count value then determines how many of them to
awaken. The count value defaults to Infinity, meaning
that every thread will be awakened.

If you have
four threads waiting and set the value to three, then all but
one of them will be woken up. “Timing and
Nondeterminism” examines the order of these waking
threads.

The return value is the number of threads that have been
awoken once the method is complete. If you were to pass in
a TypedArray instance that points to a nonshared
ArrayBuffer instance, this will always return a 0. If no
threads happen to be listening at the time it will also return
a 0. Because this method doesn’t block the thread, it can
always be called from a main JavaScript thread.

### Atomics.waitAsync()

```jsx
promise = Atomics.waitAsync(typedArray, index, value, (timeout = Infinity));
```

This is essentially a promise-based version of
Atomics.wait() and is the latest addition to the Atomics
family. As of this writing it is available in Node.js v16 and
Chrome v87 but not yet available in Firefox or Safari.

This method is essentially a less-performant, nonblocking
version of Atomics.wait() that returns a promise which
resolves the status of the wait operation. Due to the loss of
performance (a resolving promise is going to have more
overhead than pausing a thread and returning a string), it
isn’t necessarily as useful for the hotpath of a CPU-heavy
algorithm

Can be useful in situations
where a lock change is more convenient to signal another
thread than to perform message-passing operations via
postMessage(). Because this method doesn’t block the
thread, it can be used in the main thread of an application.

## Timing and Nondeterminism

In order for an application to be correct it usually needs to
behave in a deterministic fashion. The Atomics.notify()
function accepts an argument count that contains the
number of threads to wake up.

### Example of Nondeterminism

Threads are woken up in FIFO (first in, first out) order,
meaning the first thread that called Atomics.wait() is the
first to be woken up, the second to call is the second to be
woken up, and so on. Measuring this can be difficult,
however, because log messages printed from different
workers aren’t guaranteed to be displayed in the terminal
in the true order that they were executed in. Ideally, you
should build your application in such a way that it
continues to work fine regardless of the order in which
threads have been awoken.

To test this for yourself, you can create a new application.
First, create a new directory named ch5-notify-order/. In it,
start off by creating another basic index.html file using the
content Below

**Example: ch5-notify-order/index.html**

```html
<html>
  <head>
    <title>Shared Memory for Coordination</title>
    <script src="main.js"></script>
  </head>
</html>
```

Next, create another main.js file, containing the content below

**Example: ch5-notify-order/main.js**

```jsx
if (!crossOriginIsolated) throw new Error('Cannot use
SharedArrayBuffer');
const buffer = new SharedArrayBuffer(4);
const view = new Int32Array(buffer);
for (let i = 0; i < 4; i++) { //1
 const worker = new Worker('worker.js');
 worker.postMessage({buffer, name: i});
}
setTimeout(() => {
 Atomics.notify(view, 0, 3);//2
}, 500);//3
```

1.- Four dedicated workers are instantiated.

2.- The shared buffer is notified at index 0.

3.- The notification is sent at half a second.

This file first creates a 4-byte buffer, which is the smallest
buffer that can support the needed Int32Array view. Next,
it creates four different dedicated workers using a for
loop. For each of the workers it immediately calls the
appropriate postMessage() call to pass in both the buffer
as well as the identifier for the thread. This results in five
different threads that we care about; namely the main
thread and threads that we’ve nicknamed 0, 1, 2, and 3.

JavaScript creates those threads, and the underlying
engine goes to work assembling resources, allocating
memory, and otherwise doing a lot of magic for us behind
the scenes. The amount of time that it takes to perform
those tasks is nondeterministic, which is unfortunate.

To finish off the application, create a file named worker.js,
and add the content below

**Example: ch5-notify-order/worker.js**

```jsx
self.onmessage = ({ data: { buffer, name } }) => {
  const view = new Int32Array(buffer);
  console.log(`Worker ${name} started`);
  const result = Atomics.wait(view, 0, 0, 1000); //1
  console.log(`Worker ${name} awoken with ${result}`);
};
```

1.- Wait on 0th entry in buffer, assuming initial value of 0,
for up to 1 second.

The worker accepts the shared buffer and the name of the
worker thread and stores the values, printing a message
that the thread has been initialized. It then calls
Atomics.wait() using the 0th index of the buffer. It
assumes an initial value of 0 is present in the buffer (which
it is, since we haven’t modified the value). The method call
also uses a timeout value of one second (1,000 ms). Finally,
once the method call is complete, the value is printed in the
terminal.

Once you’ve finished creating these files, switch to a
terminal and run another web server to view the content.
Again, you can do so by running the following command:

```
$ npx MultithreadedJSBook/serve .
```

### Detecting Thread Preparedness

A simple way to do so is to call postMessage() from within
the worker threads to post back to the parent thread at
some point during the onmessage() handler. This works
because once the onmessage() handler has been called the
worker thread has finished its initial setup and is now
running JavaScript code.

Here’s an example of the quickest way to pull this off. First,
copy the ch5-notify-order/ directory you created and paste
it as a new ch5-notify-when-ready/ directory. Inside this
directory the index.html file will remain the same, though
the two JavaScript files will be updated. First, update
main.js to contain the content below

**Example: ch5-notify-when-ready/main.js**

```jsx
if (!crossOriginIsolated) throw new Error('Cannot use
SharedArrayBuffer');
const buffer = new SharedArrayBuffer(4);
const view = new Int32Array(buffer);
const now = Date.now();
let count = 4;
for (let i = 0; i < 4; i++) {//1
 const worker = new Worker('worker.js');
 worker.postMessage({buffer, name: i}); //2
 worker.onmessage = () => {
 console.log(`Ready; id=${i}, count=${--count},
time=${Date.now() - now}ms`);
 if (count === 0) {//3
 Atomics.notify(view, 0);
 }
 };
}
```

1.- Instantiate four workers.

2.- Immediately post a message to the workers.

3.- Notify on the 0th entry once all four workers reply

The script has been modified so that Atomics.notify()
will be called after each of the four workers has posted a
message back to the main thread. Once the fourth and final
worker has posted a message, the notification is then sent.

This allows the application to post a message as soon as it’s
ready, likely saving hundreds of milliseconds in the best
case, and preventing a failure in the worst case (like when
running the code on a very slow single-core computer).

The Atomics.notify() call has also been updated to
simply wake up all threads instead of just three, and the
timeout has been set back to the default of Infinity. This
was done to show that every thread will receive the
message on time.

Next, update worker.js to contain the content below

**Example: ch5-notify-when-ready/worker.js**

```jsx
self.onmessage = ({ data: { buffer, name } }) => {
  postMessage("ready"); //1
  const view = new Int32Array(buffer);
  console.log(`Worker ${name} started`);
  const result = Atomics.wait(view, 0, 0); //2
  console.log(`Worker ${name} awoken with ${result}`);
};
```

1.- Post message back to parent thread to signal readiness.

2.- Wait for notification on the 0th entry.

This time the onmessage handler immediately calls
postMessage() to send a message back to the parent.
Then, the wait call happens shortly afterward.

When you run this code, the new logs print out three pieces
of information: the name of the thread, the countdown
(always in the order of 3, 2, 1, 0), and finally the amount of
time it took for the thread to be ready since the start of the
script. Run the same command that you ran before and
open the resulting URL in your browser.

In this case, with a 16-core laptop, Firefox seems to take
around four times as long to initialize the worker threads
as Chrome does. Also, Firefox gives a more random thread
order than Chrome. Each time the page is refreshed the
order of threads for Firefox changes but the order in
Chrome does not. This then suggests that the V8 engine
used by Chrome is more optimized for starting new
JavaScript environments or instantiating browser APIs than
the SpiderMonkey engine used by Firefox.
