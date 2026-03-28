# Use the official Node.js 22 Alpine image for a lightweight footprint
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for Vite and tsx)
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Build the React frontend into static files (build/ folder)
RUN npm run build

# Expose the port that the Express server will listen on
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Start the Express backend using tsx
CMD ["npm", "start"]
