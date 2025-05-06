# Use the Node.js Alpine base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency files first (for caching)
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --production

# Copy the rest of the application code
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Default command
CMD ["node", "index.js"]
