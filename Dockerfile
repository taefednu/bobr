# Сайт Bobr на любом сервере с Docker. Адрес Convex попадает в клиентский код при сборке.
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json .nvmrc ./
COPY scripts/node-shim.sh scripts/node-shim.sh
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_CONVEX_URL
RUN test -n "$NEXT_PUBLIC_CONVEX_URL" && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
