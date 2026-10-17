# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/database ./database
COPY --from=build /app/.sequelizerc ./.sequelizerc
# Created as node so the mounted uploads volume is writable by the API.
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 3000
# Runs pending migrations + seeders (each tracked, so only once), then starts the API.
CMD ["npm", "run", "start:prod"]
