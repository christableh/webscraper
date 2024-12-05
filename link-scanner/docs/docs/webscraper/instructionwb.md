---
sidebar_position: 1
---

# What it does?

Users are able to **scrape** the URL input, which returns one sentence **summaries** of what each embedded link within the URL entails. Utilising Selenium and BeautifulSoup for functional scraping of javascript pages.

## Single URL input

Unlike link checker, **only one** URL can be scraped at one time as scraping takes quite awhile due to dynamic and heavy loaded javascript pages. 

## Output

It will return summaries based on parent link and its respective child links within each parent link, for easier interpretation as to which links are within each parent link. 

## Limitations
A limitation is that it takes a period of time to scrape heavy loaded javascript pages. This is especially due to scraping being a heavy tasks, scraping links within links is intensive at large depths. As such, some URLs scraped do not have scraped summary and it returns 'no content available'. 

Another limitation is that Selenium timesout after a certain period, even though max timeout has been set to 24 hours. This is possible due to several reasons. Selenium and chrome driver has its own timeout settings, causing it to timeout even though timeout has been explicitly set. It could also be due to the increasing complexity as it goes into deeper depths, requireing more complex interactions as the amount of links could be doubled or more, needing more resources to process. 

As such, it is only able to scrape till depth 2 and any deeper, selenium tends to timeout and the heavy dynamic pages are not able to be scraped when depth 3 is set. 

## Testings & other methods tested
In the initial stage, **Scrapy** and **Puppeteer** was used to help with web scraping, but it is limited as it can only parse HTML and XML documents. This is not helpful when it comes to react pages and javascript rendered pages as Scrapy is unable to scrape it. Puppeteer also has its limitations when scraping javascript pages as well as issues with chrome browser. Hence, after many tries and testing, BeautifulSoup and Selenium was the best choice to acheive the desired functionality. 

## Additional feature 1: Liveness Check 

Within the URL, user can check liveness of each scraped link, parent or child, and it will return the same liveness status and status code as the Link Scanner:

- if live: 🟢 Live (Status Code: )
- if not live: 🔴 Not Live (Status Code: )

## Additional feature 2: Exporting results in PDF

After scraping and link checking is done, option to export results into pdf for compiled results. The pdf includes the embedded links, summary (if applicable) and the liveness and status code of each scraped link.