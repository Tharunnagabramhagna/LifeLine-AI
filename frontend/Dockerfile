# Use Node.js image
FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Vite default port
EXPOSE 5173

# Run vite with host flag to allow external connections from the host machine
CMD [ "npm", "run", "dev", "--", "--host", "0.0.0.0" ]
