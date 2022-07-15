#Web Workers

Web Workers are a web platform extension on top of browserJS behavior, which allows a JS file to run in a completely
separate thread (operating system wise) from the thread that’s running the main JS program.

Since these Web Worker programs run on a separate thread, they’re restricted in their communications with the main
application thread, to avoid/limit race conditions and other complications. Web Worker code does not have access to
the DOM, for example. Some web APIs are, however, made available to the worker, such as navigator.

Since a Web Worker is treated as a wholly separate program, it does not share the global scope with the main JS program.

However, the browser’s JS engine is still running the code, so we can expect similar purity of its global scope behavior.
Since there is no DOM access, the window alias for the global scope doesn’t exist.

In a Web Worker, the global object reference is typically made using self.
