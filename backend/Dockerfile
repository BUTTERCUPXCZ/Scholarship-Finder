# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy only package files first for better caching
COPY package*.json ./

# Install all deps including dev (for build + Prisma)
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client & build app
RUN npx prisma generate && npm run build


# ---------- Production Stage ----------
FROM node:20-alpine AS production

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -S nodejs && adduser -S appuser -G nodejs

WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built app & Prisma client
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Change ownership
RUN chown -R appuser:nodejs /app
USER appuser

# Expose app port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Entrypoint and start command
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
