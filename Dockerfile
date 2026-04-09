git checkout -b chore/add-docker-support# Use official Node.js image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (adjust if needed)
EXPOSE 3000

# Start the application (adjust if needed)
CMD ["npm", "start"]
