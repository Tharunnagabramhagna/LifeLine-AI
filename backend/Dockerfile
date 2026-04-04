# Use Node.js LTS image
FROM node:20-slim

# Install build dependencies for better-sqlite3 (native modules)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD [ "node", "server.js" ]
