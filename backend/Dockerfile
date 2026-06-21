# Use Node.js 20 Alpine for a lightweight image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD [ "npm", "start" ]
