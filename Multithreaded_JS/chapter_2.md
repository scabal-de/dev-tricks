# Multitreaded JavaScript

## Chapter 2 - Browsers

JavaScript doesn’t have a single, bespoke implementation
like most other programming languages do. For example,
with Python, you’re probably going to run the Python
binary provided by the language maintainers. JavaScript,
on the other hand, has many different implementations.
This includes the JavaScript engine that ships with different
web browsers, such as V8 in Chrome, SpiderMonkey in
Firefox, and JavaScriptCore in Safari. The V8 engine is also
used by Node.js on the server.

## Dedicated Workers

Web workers allow you to spawn a new environment for
executing JavaScript in. JavaScript that is executed in this
way is allowed to run in a separate thread from the
JavaScript that spawned it.

Communication occurs between
these two environments by using a pattern called message
passing. Recall that it’s JavaScript’s nature to be singlethreaded
Web workers play nicely with this nature and
expose message passing by way of triggering functions to
be run by the event loop.

## Shared Workers

A shared worker is another type of web worker that can be
accessed by different browser environments, such as different windows
(tabs), across iframes, and even from different web
workers.

- WARNING: Shared workers are currently disabled in Safari, and this seems to
  have been true since at least 2013, which will undoubtedly harm
  adoption of the technology.

### DEBUGGING SHARED WORKERS:

Both Firefox and Chrome offer a dedicated way to debug
shared workers. In Firefox, visit about:debugging in the
address bar. Next, click This Firefox in the left column.
Then, scroll down until you see the Shared Workers
section with a list of shared worker scripts. In our case
we see an Inspect button next to an entry for the
shared-worker.js file. With Chrome, visit
chrome://inspect/#workers, find the shared-worker.js
entry, and then click the “inspect” link next to it. With
both browsers you’ll be taken to a dedicated console
attached to the worker.

### Example:

create a directory named ch2-shared-workers/, and all the files
necessary will live in this directory. Once that’s done,
create an HTML file containing the content below

- ch2-shared-workers/red.html

```jsx
<html>
  <head>
    <title>Shared Workers Red</title>
    <script src="red.js"></script>
  </head>
</html>
```

-ch2-shared-workers/blue.html

```jsx
<html>
  <head>
    <title>Shared Workers Blue</title>
    <script src="blue.js"></script>
  </head>
</html>
```

Next, you’re ready to create the first JavaScript file loaded
directly by an HTML file. Create a file containing the
content below

- ch2-shared-workers/red.js

```jsx
console.log("red.js");

//Instantiate the shared worker
const worker = new SharedWorker("shared-worker.js");

//Note the worker.port property for communications
worker.port.onmessage = (event) => {
  console.log("EVENT", event.data);
};
```

Next, copy and paste the red.js file that you created above and name it blue.js. Update the console.log() call to print blue.js; otherwise, the content
will remain the same.

Finally, create a shared-worker.js file, containing the
content below. This is where most of the magic
will happen.

- ch2-shared-workers/shared-worker.js

```jsx
//Random ID for debugging
const ID = Math.floor(Math.random() * 999999);
console.log("shared-worker.js", ID);

//Singleton list of ports
const ports = new Set();

//Connection event handler
self.onconnect = (event) => {
  const port = event.ports[0];
  ports.add(port);
  console.log("CONN", ID, ports.size);

  //Callback when a new message is received
  port.onmessage = (event) => {
    console.log("MESSAGE", ID, event.data);

    //Messages are dispatched to each window
    for (let p of ports) {
      p.postMessage([ID, event.data]);
    }
  };
};
```

## Service Workers

A service worker functions as a sort of proxy that sits
between one or more web pages running in the browser
and the server.

They’re even “keyed” in the same manner as
shared workers. But a service worker can exist and run in
the background even when a page isn’t necessarily still
open. Because of this you can think of a dedicated worker
as being associated with one page, a shared worker as
being associated with one or more pages, but a service
worker as being associated with zero or more pages.

Service workers are primarily intended for performing
cache management of a website or a single page
application

They are most commonly invoked when
network requests are sent to the server, wherein an event
handler inside the service worker intercepts the network
request

The service worker’s claim to fame is that it can be
used to return cached assets when a browser displays a
web page but the computer it’s running on no longer has
network access. When the service worker receives the
request, it may consult a cache to find a cached resource,
make a request to the server to retrieve some semblance of
the resource, or even perform a heavy computation and
return the result

### Example:

Make a new directory named ch2-service-workers/. Then, inside this
directory, create a file with the content below

- ch2-service-workers/index.html

```jsx
<html>
  <head>
    <title>Service Workers Example</title>
    <script src="main.js"></script>
  </head>
</html>
```

- ch2-service-workers/main.js

```jsx
//Registers service worker and defines scope
navigator.serviceWorker.register("/sw.js", {
  scope: "/",
});

//Listens for a controllerchange event.
navigator.serviceWorker.oncontrollerchange = () => {
  console.log("controller change");
};

//Function to initiate request
async function makeRequest() {
  const result = await fetch("/data.json");
  const payload = await result.json();
  console.log(payload);
}
```

- ch2-service-workers/sw.js

```jsx
let counter = 0;

self.oninstall = (event) => {
  console.log("service worker install");
};

self.onactivate = (event) => {
  console.log("service worker activate");
  //Allows service worker to claim the opened index.html page.
  event.waitUntil(self.clients.claim());
};

self.onfetch = (event) => {
  console.log("fetch", event.request.url);
  if (event.request.url.endsWith("/data.json")) {
    counter++;
    //Override for when /data.json is requested.
    event.respondWith(
      new Response(JSON.stringify({ counter }), {
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    return;
  }
  //Other URLs will fall back to a normal network request.
  // fallback to normal HTTP request
  event.respondWith(fetch(event.request));
};
```

## Advanced Service Worker Concepts

Service workers are intended to only be used for
performing asynchronous operations. Because of that, the
localStorage API, which technically blocks when reading
and writing, isn’t available. However, the asynchronous
indexedDB API is available. Top-level await is disabled
within service workers as well.

## Message Passing Abstractions

exposing an
interface for passing messages into, and receiving
messages from, a separate JavaScript environment
allows you to build applications that are capable of running
JavaScript simultaneously across multiple cores.

### Message Passing pattenrs

- The RPC Pattern:
  - useful for defining protocols
- The Command Dispatcher Pattern

  - Example command dispatcher

    ```jsx
    //The definition of all supported commands
    const commands = {
      square_sum(max) {
        let sum = 0;
        for (let i = 0; i < max; i++) sum += Math.sqrt(i);
        return sum;
      },
      fibonacci(limit) {
        let prev = 1n,
          next = 0n,
          swap;
        while (limit) {
          swap = prev;
          prev = prev + next;
          next = swap;
          limit--;
        }
        return String(next);
      },
    };
    function dispatch(method, args) {
      //Check to see if command exists.
      if (commands.hasOwnProperty(method)) {
        //Arguments are spread and method is invoked.
        return commands[method](...args);
      }
      throw new TypeError(`Command ${method} not defined!`);
    }
    ```

## Putting It All Together

First, create a new directory named ch2-patterns/ to house
the files you’re going to create. In here first create another
basic HTML file named index.html containing the content below

- ch2-patterns/index.html

```jsx
<html>
  <head>
    <title>Worker Patterns</title>
    <script src="rpc-worker.js"></script>
    <script src="main.js"></script>
  </head>
</html>
```

This time the file is loading two JavaScript files. The first is
a new library, and the second is the main JavaScript file,
which you’ll now create. Make a file named main.js, and
add the content below

- ch2-patterns/main.js

```jsx
const worker = new RpcWorker("worker.js");

Promise.allSettled([
  worker.exec("square_sum", 1_000_000),
  worker.exec("fibonacci", 1_000),
  worker.exec("fake_method"),
  worker.exec("bad"),
]).then(([square_sum, fibonacci, fake, bad]) => {
  console.log("square sum", square_sum);
  console.log("fibonacci", fibonacci);
  console.log("fake", fake);
  console.log("bad", bad);
});
```

Next, create a file named rpc-worker.js, and add the
content below

- ch2-patterns/rpc-worker.js

```jsx
class RpcWorker {
  constructor(path) {
    this.next_command_id = 0;
    this.in_flight_commands = new Map();
    this.worker = new Worker(path);
    this.worker.onmessage = this.onMessageHandler.bind(this);
  }

  onMessageHandler(msg) {
    const { result, error, id } = msg.data;
    const { resolve, reject } = this.in_flight_commands.get(id);
    this.in_flight_commands.delete(id);
    if (error) reject(error);
    else resolve(result);
  }

  exec(method, ...args) {
    const id = ++this.next_command_id;
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.in_flight_commands.set(id, { resolve, reject });
    this.worker.postMessage({ method, params: args, id });
    return promise;
  }
}
```

With the RPC worker file out of the way, you’re ready to
create the last file. Make a file named worker.js, and add
the content

- ch2-patterns/worker.js

```jsx
//Adds artificial slowdown to methods.
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

//A basic wrapper to convert onmessage to an async function.
function asyncOnMessageWrap(fn) {
  return async function (msg) {
    postMessage(await fn(msg.data));
  };
}

const commands = {
  async square_sum(max) {
    //Artificial random slowdowns are added to the commands.
    await sleep(Math.random() * 100);
    let sum = 0;
    for (let i = 0; i < max; i++) sum += Math.sqrt(i);
    return sum;
  },
  async fibonacci(limit) {
    await sleep(Math.random() * 100);
    let prev = 1n,
      next = 0n,
      swap;
    while (limit) {
      swap = prev;
      prev = prev + next;
      next = swap;
      limit--;
    }
    //The BigInt result is coerced into a JSON-friendly string value.
    return String(next);
  },
  async bad() {
    await sleep(Math.random() * 10);
    throw new Error("oh no");
  },
};
//The onmessage wrapper is injected.
self.onmessage = asyncOnMessageWrap(async (rpc) => {
  const { method, params, id } = rpc;
  if (commands.hasOwnProperty(method)) {
    try {
      const result = await commands[method](...params);
      //A successful JSON-RPC-like message is resolved on success.
      return { id, result };
    } catch (err) {
      return { id, error: { code: -32000, message: err.message } };
    }
  } else {
    //An erroneous JSON-RPC-like message is rejected if a method doesn’t exist.
    return {
      id,
      error: {
        code: -32601,
        message: `method ${method} not found`,
      },
    };
  }
});
```
