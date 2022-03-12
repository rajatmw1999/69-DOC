- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
- Resolve and reject are dealt with in promises when we are creating a promise. That is, when the promise we are creating has to be return some data, in that case, we call reject or resolve, but in case of consuming promises, we don't really need to deal with resolve and reject, just deal with either .then.catch or async/await
- We should create promises to wrap functions that make async calls. That is the whole point. Promises are guaranteed to be async and thus resolve or reject after our async call is made, this can be a call to a db, uploading files etc.
```
let myFirstPromise = new Promise((resolve, reject) => {
  // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
  // In this example, we use setTimeout(...) to simulate async code.
  // In reality, you will probably be using something like XHR or an HTML5 API.
  setTimeout( function() {
    resolve("Success!")  // Yay! Everything went well!
  }, 250)
})

myFirstPromise.then((successMessage) => {
  // successMessage is whatever we passed in the resolve(...) function above.
  // It doesn't have to be a string, but if it is only a succeed message, it probably will be.
  console.log("Yay! " + successMessage)
});
```

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

### Topics
 
- Web worker
- Service worker
- process.on and process module in NodeJS
- Event loop
- Task queue
- Microtask