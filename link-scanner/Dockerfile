# Use Node.js with Alpine as the base image
FROM node:18-alpine

# Install necessary system and browser dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    libffi-dev \
    openssl-dev \
    chromium \
    chromium-chromedriver \
    ttf-freefont \
    fontconfig \
    freetype \
    harfbuzz \
    ca-certificates \
    nss \
    bash

# Set environment variables for Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create a directory for Playwright browsers
RUN mkdir -p /ms-playwright

# Install Playwright and manually install browsers
RUN npm install -g playwright && \
    npx playwright install chromium && \
    ln -sf /usr/bin/chromium-browser /usr/bin/google-chrome && \
    ln -sf /usr/bin/chromedriver /usr/local/bin/chromedriver

# Set working directory for the app
WORKDIR /app

# Install Python dependencies
COPY python_scripts/requirements.txt /app/python_scripts/requirements.txt
RUN python3 -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/python_scripts/requirements.txt

# Copy application code
COPY . .

# Install Node.js dependencies for frontend and backend
WORKDIR /app/react
RUN npm install && npm run build

WORKDIR /app/express
RUN npm install

# Install Docusaurus and build documentation
WORKDIR /app/docs
RUN npm install && npm run build

# Expose necessary ports
EXPOSE 3001 3002 3003

# Install `concurrently` and `serve` globally
RUN npm install -g concurrently serve

# Start the application
CMD ["npx", "concurrently", \
    "\"serve -s /app/react/build --listen 3001\"", \
    "\"node /app/express/server.js --port 3002\"", \
    "\"serve -s /app/docs/build --listen 3003\""]
