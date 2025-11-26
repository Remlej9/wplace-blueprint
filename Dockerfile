# 1) Install deps
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
# Install all deps (including dev) for build step
RUN npm ci

# 2) Build the app
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set envs needed at build time (optional)
ENV NODE_ENV=production

RUN npm run build

# 3) Runtime image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# If you want, you can toggle this later using docker build args/env files.
# For now, set to true to show "Under construction" in prod.
ENV NEXT_PUBLIC_MAINTENANCE=true

# Copy only what's needed to run
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
