---
sidebar_position: 2
---
# Code Documentation
The basis of this functionality is implemented using **fetch API**.

Using `await fetch()` sends an HTTP request to the specific url using HEAD method, which returns a Promise which is fulfilled with response objects and returns the status code of the each link when called. HEAD method only passes and returns the status code and not the whole body of the url, which minimises time of liveness check.

Using `response.status` that returns the actual status code of the respective link when the button is called. This show the status code: `200` etc.

``` js
if (!urls || urls.length === 0) {
        return res.status(400).json({ message: 'No URLs provided' });
    }

    try {
        const livenessResults = await Promise.all(
            urls.map(async (url) => {
                try {
                    // Perform the HEAD request for liveness check
                    const response = await fetch(url, { method: 'HEAD' });

                    // Always return the response status code (e.g., 200, 404, 500)
                    return {
                        url,
                        status: response.ok ? 'live' : 'not live',
                        statusCode: response.status,  // Return the actual status code
                    };
                } catch (error) {
                    // In case of a network/DNS error, still return a meaningful response
                    return {
                        url,
                        status: 'not live',
                        statusCode: error.code || 'Network/DNS error',  // Return network/DNS error if applicable
                    };
                }
            })
        );
```

The react component then returns the **status** for better user visualisation for each corresponding URL:
🟢 Live | 🔴 Not Live (Status:)