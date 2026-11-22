# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-fund --no-audit

# ---------- desenvolvimento (Vite com hot-reload; código montado via volume) ----------
FROM deps AS dev
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- build ----------
FROM deps AS build
COPY --chown=node:node . .
RUN npm run build

# ---------- produção (nginx serve o SPA e faz proxy de /api) ----------
FROM nginx:1.29-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
