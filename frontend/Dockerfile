# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- run: static files + /api reverse proxy ----------
FROM nginx:1.27-alpine
# nginx's entrypoint renders /etc/nginx/templates/*.template with envsubst at start-up.
ENV BACKEND_URL=http://backend:3000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
