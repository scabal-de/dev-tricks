const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

if (isMainThread) {
  const worker = new Worker(__filename, { workerData: { num: 5 } });
  worker.once("message", (result) => {
    console.log("square of 5 is :", result);
  });
} else {
  parentPort.postMessage(workerData.num * workerData.num);
}
