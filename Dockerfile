FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port (Hugging Face Spaces and Cloud Run use 7860 or 3000 typically, our server uses 3000)
# We need to make sure the express server uses the PORT environment variable if provided
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
