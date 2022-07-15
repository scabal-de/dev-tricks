# Multitreaded JavaScript

## Chapter 1 - Introduction

- Before threads, a single program
  (that is, a single process) could not have multiple tasks
  running at the same time. Instead, programmers wishing to
  perform tasks concurrently would either have to split up
  the task into smaller chunks and schedule them inside the
  process or run separate tasks in separate processes and
  have them communicate with each other.

### Example 1-1. A typical chunk of asynchronous JavaScript code, using two different patterns

---

```jsx
readFile(filename, (data) => {
  doSomethingWithData(data, (modifiedData) => {
    writeFile(modifiedData, () => {
      console.log("done");
    });
  });
});
```

or

```jsx
const data = await readFile(filename);
const modifiedData = await doSomethingWithData(data);
await writeFile(filename);
console.log("done");
```

---

## What Are Threads?

In all modern operating systems, all units of execution
outside the kernel are organized into processes and
threads. Developers can use processes and threads, and
communication between them, to add concurrency to a
project. On systems with multiple CPU cores, this also
means adding parallelism.

When you execute a program, such as Node.js or a code
editor, you’re initiating a process. This means that code is
loaded into a memory space unique to that process, and no
other memory space can be addressed by the program
without asking the kernel either for more memory or for a
different memory space to be mapped in. Without adding
threads or additional processes, only one instruction is
executed at a time, in the appropriate order as prescribed
by the program code.

## Concurrency Versus Parallelism

- Concurrency: Tasks are run in overlapping time.
- Parallelism: Tasks are run at exactly the same time.

consider that tasks may be broken up into smaller parts and then
interleaved. In this case, concurrency can be achieved
without parallelism because the time frames that the tasks
run in can be overlapped. For tasks to be running with
parallelism, they must be running at exactly the same time.

If your system is only allowing for
concurrency due to only having a single CPU core available
or being already loaded with other tasks, then there may
not be any perceived benefit to using extra threads. In fact,
the overhead of synchronization and context-switching
between the threads may end up making the program
perform even worse.

## Single-Threaded JavaScript

Instead of threads as a concurrency primitive, most
JavaScript code is written in an event-oriented manner
operating on a single execution thread.

The callbacks are at the core of how asynchronous programming is done
in Node.js and the browser.
Even in promises or the async/await syntax, callbacks are the underlying primitive.

- The callbacks are not running in parallel, or alongside any other code

For example,imagine you want to open three files containing numbers,
named 1.txt, 2.txt, and 3.txt, and then add up the results
and print them. In Node.js, you might do something like

```jsx
import fs from "fs/promises";
async function getNum(filename) {
  return parseInt(await fs.readFile(filename, "utf8"), 10);
}
try {
  const numberPromises = [1, 2, 3].map((i) => getNum(`${i}.txt`));
  const numbers = await Promise.all(numberPromises);
  console.log(numbers[0] + numbers[1] + numbers[2]);
} catch (err) {
  console.error("Something went wrong:");
  console.error(err);
}
```

To run this code, save it in a file called reader.js. Make sure
you have text files named 1.txt, 2.txt, and 3.txt, each
containing integers, and then run the program with

```js
node reader.js
```

## Hidden Threads

While your JavaScript code may run, at least by default, in
a single-threaded environment, that doesn’t mean the
process running your code is single-threaded. In fact, many
threads might be used to have that code running smoothly
and efficiently. It’s a common misconception that Node.js is
a single-threaded process.

In Node.js, libuv is used as an OS-independent
asynchronous I/O interface, and since not all systemprovided I/O interfaces are asynchronous, it uses a pool of
worker threads to avoid blocking program code when using
otherwise-blocking APIs, such as filesystem APIs. By
default, four of these threads are spawned, though this
number is configurable via the UV_THREADPOOL_SIZE
environment variable, and can be up to 1,024.
