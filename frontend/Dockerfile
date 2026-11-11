FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production \
    && index_file="$(find dist -type f -name index.html -print -quit)" \
    && test -n "$index_file" \
    && mkdir -p /app/nginx-html \
    && cp -a "$(dirname "$index_file")"/. /app/nginx-html/

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/nginx-html/ /usr/share/nginx/html/

EXPOSE 8080
