FROM node:19-alpine

WORKDIR /app

# Install bash for development purposes
RUN apk add --no-cache bash

# Copy package files (will be created by Next.js init)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create non-root user and set permissions
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Create .next directory and set permissions
RUN mkdir -p /app/.next && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "dev"]
