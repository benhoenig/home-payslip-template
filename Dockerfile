FROM node:18-slim

# Install latest Chrome with a more reliable method
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Verify Chrome installation and print version
RUN google-chrome --version
RUN which google-chrome
RUN ls -la /usr/bin/google-chrome

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with legacy-peer-deps flag to resolve conflicts
RUN npm install --legacy-peer-deps

# Copy app source
COPY . .

# Create public directory
RUN mkdir -p public

# Copy logo to public directory if it exists
RUN if [ -f home_logo.svg ]; then cp home_logo.svg public/; fi

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "app.js"] 