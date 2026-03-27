# Use official Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Expose port (Cloud Run default is 8080)
# The server.ts is configured to use process.env.PORT || 3000
ENV PORT=8080
EXPOSE 8080

# Start the application
# This runs 'tsx server.ts' which serves the built frontend from /dist
CMD ["npm", "start"]
