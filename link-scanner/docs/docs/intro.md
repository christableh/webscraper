---
sidebar_position: 1
---

# Introduction and Setup

A documentation of what and how the Broken link scanner functions! A simple website that does web scraping and link checking with a simple frontend look that makes it easy to use for users.

a. Web Scraping 

Scrapes URLs via user input, and returns all **embedded links and a sentence summary** of what the link contains. 

b. Link Checker

Checks links for liveness via user input, and returns **liveness status** of each link and respective status code.

## 1. Usage 
It can scrape other react pages URLS and check for liveness of all embedded links scrapped. The Link Scanner can check for all URLs input and return the relative status and code. Able to be used for intranet usages through testings.

## 2. Running Locally 

Before running the program, ensure to install all node modules if have not already done so.

```
cd express 
npm install

cd react
npm install 
```

### Running the backend: node.js and python

```
cd ../python_scripts
python3 -m venv venv         # Create a virtual environment
source venv/bin/activate     # Activate the virtual environment (use venv\Scripts\activate on Windows)
pip install -r requirements.txt  # Install required Python packages

cd express
npm start
```

### Running the frontend: node.js

```
cd react 
npm start 
```

### Running the documentation: docusaurus


```
cd docs 
npm run start 
```

## 3. Running in docker 
Build the docker image:
```
docker build -t project-name .
```

Run the container:
```
docker run -p 3001:3001 -p 3002:3002 -p 3003:3003 project-name
```