importScripts('./ngsw-worker.js');

// Global variable to track failed fetch attempts
let failedFetchAttempts = 0;

self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
});

// Expose custom register method to the main thread
self.addEventListener('message', event => {
  const { action, tag, data } = event.data;
  if (event.data && action === 'registerCache') {
    event.waitUntil(sendErrorReport(data, tag));
  }
});

async function sendErrorReport(data, cacheTag) {
  const { type, errorData, capturedURL, url } = data; // retrieve error data
  console.log('sendErrorReport', data, data.errorData)
  const errorDataWithUrl = {
    stack: data.errorData,
    capturedUrl: data.capturedURL,
  };
  try {
    const cache = await caches.open(cacheTag); // create a cache storage named 'error-object'
    await cache.put('error-data-cache', new Response(JSON.stringify(errorDataWithUrl), { headers: { 'Content-Type': 'application/json' }})); // Create a new entry called error-data-cache which stores the error data

    if (!navigator.onLine) {
      // If browser is offline, wait for it to come back online
      return new Promise(resolve => {
        const checkOnline = () => {
          if (navigator.onLine) { // if navigator is online post the report to trackit & resolve the promise
            postErrorReport(url, data.errorData.stack, cache, cacheTag).then(resolve);
          } else {
            setTimeout(checkOnline, 1000); // Check again after 1 second
          }
        };
        checkOnline(); // recursive callback
      });
    } else { // if navigator is online post the report to trackit
      await postErrorReport(url, errorData, cache, cacheTag);
    }
  } catch (error) {
    alert('Error occurred whilst sending error report - Please copy the error and send it to warehouse@fera.co.uk. Error report: n/', error);
    window.location.href = "mailto:warehouse@fera.co.uk+?subject=Error Report From PHIW FE&body="+errorDataWithUrl
  }
}

async function postErrorReport(url, errorData, cache, cacheTag) {
  try {
    const cache = await caches.open(cacheTag);
    const cachedResponses = await cache.keys();
    if (!cachedResponses) {
      throw new Error('Cached error data not found.');
    }
    cachedResponses.forEach(async request => {
      const response = await cache.match(request);
      const cachedData = await response.json();
      console.log(response, cachedData)
      // Notify the Angular application
      const allClients = await self.clients.matchAll();
      allClients.forEach(client => {
        client.postMessage({
          type: 'ERROR_REPORT_SENT',
          message: 'Error report has been sent successfully. Please avoid the same operation and wait for further notice.',
          errorCache: cachedData,
        });
      });
      await onComplete();
    });
  } catch (error) {
    console.error('postErrorReport: Error occurred -', error);
  }
}

async function onComplete() {
  try {
    const cache = await caches.open('error-object'); // open the cacheStorage for Errors
    await cache.delete('error-data-cache'); // remove an entry from the cache
    await caches.delete('error-object'); // remove the cache storage for error-object
    console.log('Removed cache error-object successfully'); // Log for successful report sent
  } catch (error) {
    console.error('onComplete: No cache found for error-object:', error);
    throw error; // If no cache is found then throw as error and nothing to do here
  }
}