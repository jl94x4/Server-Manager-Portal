# --- Build frontend assets and version stamp ---
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# .git is excluded from the build context; CI passes GIT_SHA/GITHUB_REF so version stamps match the commit.
ARG GIT_SHA
ARG GITHUB_REF
ENV GIT_SHA=${GIT_SHA}
ENV GITHUB_REF=${GITHUB_REF}

COPY package.json package-lock.json ./
# Use install (not ci) so Windows-generated lockfiles / optional platform pkgs cannot hard-fail the image build.
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build \
    && test -f style.css || printf '/* Legacy stylesheet placeholder */\n' > style.css \
    && npm prune --omit=dev \
    && npm cache clean --force

# --- Production image ---
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV BIND_HOST=0.0.0.0
ENV PORT=2121
ENV FORCE_SECURE_COOKIES=false

RUN apt-get update \
    && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js ./
COPY --from=builder /app/index.html ./
COPY --from=builder /app/style.css ./
COPY --from=builder /app/version.txt ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/static ./static
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p config backup \
    && chown -R node:node /app

EXPOSE 2121

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:2121/api/config/public').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "index.js"]
