import express from 'express';
import fetch from 'node-fetch'; // Ensure you have node-fetch installed for making fetch requests.

const router = express.Router();

router.post('/', async (req, res) => {
    const { urls } = req.body;  // Expect an array of URLs

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

        // Send the results back to the client as JSON
        res.json(livenessResults);
    } catch (error) {
        // Handle any server-side errors that may occur
        res.status(500).json({ message: 'Error checking liveness', error: error.message });
    }
});

export default router;
