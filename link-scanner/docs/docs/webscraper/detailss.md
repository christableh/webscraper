---
sidebar_position: 2
---

# Code Documentation
The basis of this function is using **Selenium** and **BeautifulSoup4 with requests** for web scraping dynamic pages.

## Selenium 
It is an open-source automated testing tool that can test for web applications across browsers, it is commonly used for web scraping. It interacts with web pages like a human user as it can mimic the actions of scrolling, clicking etc. Selenium renders the page and is able to locate the HTML content of the web page.

Selenium itself is a powerful tool, but it has limitations when it comes to complex and dynamic elements. As such, utilising Selenium only is not enough to acheive the desired functionality. 

### Javascript implementation

The function below scrapes the links recursively to depth to scrape for 'child' links within each 'parent' link. Incoporating Selenium function to mimic human interaction to scroll and click on buttons to reveal all the links within each component. It then calls to run the python script to extract the embedded links and returns the output:
``` js
// Recursive function to scrape links and go deeper into nested links
const scrapePageWithEmbeddedLinks = async (driver, url, depth = 1, maxDepth = 2) => {
  let result = [];
  const cleanedUrl = cleanUrl(url);

  if (depth > maxDepth) {
    console.log(`Reached max depth of ${maxDepth} at URL: ${cleanedUrl}`);
    return result;
  }

  try {
    if (visitedLinks.has(cleanedUrl)) {
      console.log(`URL already visited: ${cleanedUrl}`);
      return result;
    }

    console.log(`Scraping URL: ${cleanedUrl} at depth: ${depth}`);
    visitedLinks.add(cleanedUrl);

    await driver.get(cleanedUrl);
    await waitForPageLoad(driver);
    await scrollToBottom(driver);

    // Extract the title and content specifically from <p> tags using Selenium
    const title = await driver.executeScript(`
      return document.querySelector('p.stories-title')?.innerText || 
             document.querySelector('p')?.innerText || 
             'No title available';
    `);

    // Run Python script for embedded links
    const pageSource = await driver.getPageSource();
    const additionalData = await runPythonScript(pageSource, cleanedUrl);

    // Extract links using JavaScript on the main page
    const links = await driver.executeScript(`
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(link => !link.startsWith('mailto:'));
    `);

    const absoluteLinks = links.map(link => new URL(link, cleanedUrl).href);
    const uniqueLinks = [...new Set(absoluteLinks)];

    console.log(`Found ${uniqueLinks.length} unique links at ${cleanedUrl}`, links);

    // Combine the title and content with the links extracted
    result.push({
      url: cleanedUrl,
      additionalData: {
        title,
      },
      links: uniqueLinks,
    });

    // Process embedded links without modifying the output structure
    for (const embeddedLink of uniqueLinks) {
      if (!visitedLinks.has(embeddedLink)) {
        try {
          const deeperResult = await scrapePageWithEmbeddedLinks(driver, embeddedLink, depth + 1, maxDepth);
          result = result.concat(deeperResult); // Combine results
        } catch (deeperError) {
          console.error(`Error scraping embedded link: ${embeddedLink} - ${deeperError.message}`);
        }
      }
    }
    return result;

  } catch (error) {
    console.error(`Error scraping ${url}: ${error.message}`);
    return result;  // Return whatever results have been collected so far
  }
};
```

This section calls the Selenium WebDriver that does the scraping functionality and categorizing them accordingly:
```js
let driver;
  try {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-setuid-sandbox');

    // Connect to Selenium Hub
    driver = await new Builder()
      .usingServer('http://selenium-hub:4444/wd/hub')  // Adjust to Selenium server address
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Scrape starting from the provided URL
    const scrapeResult = await scrapePageWithEmbeddedLinks(driver, url);

    // Backend: Return consistent structure
    const formattedResult = {
      categories: {
        [url]: scrapeResult.map(result => ({
          url: result.url,
          additionalData: {
            title: result.additionalData?.title || 'No title available',  // Safe access with fallback
          },
          embedded_links: result.links || []  // Provide an empty array if no links
        }))
      }
    }
  }
```

This section is to run the python script after Selenium has rendered pages for link extraction:
```js
// Function to run Python Script
const runPythonScript = (htmlContent, baseUrl) => {
  return new Promise((resolve, reject) => {
    const command = `python3 /app/python_scripts/scrape_links.py "${baseUrl}"`; // Run Python script

    const child = exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Python execution error:', error);
        return reject(new Error('Python execution error'));
      }

      if (stderr) {
        console.error('Python stderr:', stderr);
        return reject(new Error(`Python stderr: ${stderr}`)); // Return if stderr
      }

      try {
        console.log('Python stdout:', stdout);  // Log stdout for debugging

        if (!stdout || !stdout.trim()) {
          throw new Error('No output from Python script');
        }

        const result = JSON.parse(stdout);  // Parse JSON output
        resolve(result);
      } catch (err) {
        reject(new Error(`Error parsing Python output: ${err}`));  // Handle JSON parse errors
      }
    });

    // Pass the HTML content to Python script via stdin
    child.stdin.write(htmlContent);
    child.stdin.end();
  });
};
```

## BeautifulSoup4 & Requests 
Requests first handles the HTTP connection to retrieve the webpage and send it to Beautifulsoup for data extraction. Beautifulsoup extracts the HTML and XML content from the rendered page from Selenium via `<>` tags in the HTML by extracting `a href` tags for embedded links.

### Python implementation 

This section is the main function to scrape the page. It called `requests.get` to get the HTTP connection to the web page and passes it to BeautifulSoup:
```python
def scrape_page(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        html_content = response.text
        soup = BeautifulSoup(html_content, 'html.parser')

        # Extract page content (titles, paragraphs, headings)
        page_content = extract_page_content(soup)

        # Extract links from the page
        links = scrape_links_from_html(html_content, url)

        return {
            'url': clean_url(url),  # Apply clean_url to the URL here as well
            'content': page_content,
            'links': links
        }

    except requests.RequestException as e:
        return {
            'url': clean_url(url),  # Ensure cleaned URL is returned in case of error
            'error': str(e),
            'links': []
        }
```

This section extracts the embedded links wihtin each link by locating the `a href` and `link` in the case where it is not captured within the `a href` tags.
```python
def scrape_links_from_html(html_content, base_url):
    soup = BeautifulSoup(html_content, 'html.parser')
    links = []

    # Extract <a> tag links
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        if href and not href.startswith(('javascript:', 'mailto:', '#')):
            full_url = clean_url(urljoin(base_url, href))  # Apply clean_url here
            links.append(full_url)

    # Extract <link> tag links
    for link_tag in soup.find_all('link', href=True):
        href = link_tag['href']
        full_url = clean_url(urljoin(base_url, href))  # Apply clean_url here too
        links.append(full_url)

    return list(set(links))
```

## Frontend 
The frontend ensures that the backend and frontend is synced up properly to display the scraped links and liveness of it in a user friendly and organised way. Utilising Material UI for the styling and designing it in a way with minimal components for simple and easy usage.

It processess the results sent from backend to frontend to ensure that the links are displayed accordingly, where each child link is printed under each parrent link:
```js
const processBackendData = (data) => {
  console.log('Backend categories data in processBackendData:', JSON.stringify(data, null, 2));

  return Object.entries(data).map(([category, links]) => ({
      category,
      links: links.map(link => ({
          url: link.url || 'No link available',
          title: link.additionalData?.title || 'No title available',
          embedded_links: link.embedded_links
              ? link.embedded_links.map(embeddedUrl => ({
                    url: embeddedUrl,
                    title: 'No title available',
                }))
              : []
      }))
  }));
};
```

## Liveness check feature
Incoporating liveness check (which is a function itself in the link scanner section) to allow user to check for links liveness after web scraping for embedded links in the URL makes it convenient an easy to use in a simple click of the function. 

This was incoporated in the link scanner function and it was called from the react front end and when user calls for it for each link, the input is send to the backend to check for liveness. This section ensures that all the rendered links are collected to be sent to backend of liveness check correctly, to ensure that it checks links of each scraped link properly.

```js
const handleCheckLivenessForScrapedLinks = async () => {
  setError(null); // Clear previous errors
  setLivenessStatus([]); // Reset previous liveness statuses
  const allLinks = new Set();

  // Collect all unique links and embedded links from scrapeResult
  const collectAllLinks = (links) => {
    links.forEach(link => {
      const linkUrl = link.url || link.href;
      if (linkUrl) {
        const cleanedLink = cleanLink(linkUrl); // Clean each link
        allLinks.add(cleanedLink); // Use Set to avoid duplicates
      }
      if (link.embedded_links && link.embedded_links.length > 0) {
        collectAllLinks(link.embedded_links); // Recursively collect embedded links
      }
    });
  };

  // Ensure scrapeResult and categories are populated
  if (!scrapeResult || !scrapeResult.some(({ links }) => links.length > 0)) {
    setError('No links to check liveness for. Please scrape a URL first.');
    return;
  }

  // Collect all links from scrapeResult
  scrapeResult.forEach(({ links }) => {
    collectAllLinks(links);
  });

  if (allLinks.size === 0) {
    setError('No valid links found to check liveness.');
    return;
  }

  setLoading(true);  // Show spinner during the API call

  try {
    const livenessResponse = await fetch('http://localhost:3002/check-liveness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: Array.from(allLinks) }), // Convert Set to Array
    });

    if (!livenessResponse.ok) {
      throw new Error(`Failed to check liveness, status: ${livenessResponse.status}`);
    }

    const livenessData = await livenessResponse.json();
    console.log('Liveness Data for Scraped Links:', livenessData);  // Log response data

    // Transform the liveness data into a map for easy lookup
    const statusMap = {};
    livenessData.forEach(({ url, status, statusCode }) => {
      const cleanedUrl = cleanLink(url); 
      statusMap[cleanedUrl] = {
        live: status === 'live',
        statusCode: statusCode || 'N/A',
      };
    });

    setLivenessStatusMap(statusMap);  // Update state with liveness status map

  } catch (error) {
    setError(`Failed to check liveness for scraped links: ${error.message}`);
  } finally {
    setLoading(false);  // Hide spinner after API call completes
  }
};
```
It will return the status and status code next to each respective link upon clicking the 'check liveness for all links' button is called.

There are logging statements to log the results and output to give a visual aid on what has been scraped and the items being printed out.




