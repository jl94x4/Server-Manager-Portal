# --- Build frontend assets and version stamp ---
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production image ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV BIND_HOST=0.0.0.0
ENV PORT=2121

RUN addgroup -S portal && adduser -S portal -G portal

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/index.js ./
COPY --from=builder /app/index.html ./
COPY --from=builder /app/style.css ./
COPY --from=builder /app/version.txt ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/static ./static

RUN mkdir -p config backup \
    && chown -R portal:portal /app

USER portal

EXPOSE 2121

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:2121/api/config/public').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]
