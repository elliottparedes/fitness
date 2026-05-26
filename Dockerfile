FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run prepare && npm run build && npm prune --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3876

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 3876

CMD ["node", "build"]
