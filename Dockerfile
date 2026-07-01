# --- Build frontend assets and version stamp ---
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
    && test -f style.css || printf '/* Legacy stylesheet placeholder */\n' > style.css

# --- Production image ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV BIND_HOST=0.0.0.0
ENV PORT=2121

RUN apk add --no-cache su-exec \
    && addgroup -S -g 1000 portal \
    && adduser -S -u 1000 -G portal portal

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/index.js ./
COPY --from=builder /app/index.html ./
COPY --from=builder /app/style.css ./
COPY --from=builder /app/version.txt ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/static ./static
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p config backup \
    && chown -R portal:portal /app

EXPOSE 2121

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:2121/api/config/public').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "index.js"]
