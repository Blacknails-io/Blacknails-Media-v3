# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /home/node/app

# Instalamos compiladores y python necesarios para better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm ci

COPY shared ./shared
COPY server ./server
COPY client ./client

RUN npm run build --workspace=@blacknails/shared
RUN npm run build --workspace=blacknails-media-v3-server
RUN npm run build --workspace=blacknails-media-v3-client

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /home/node/app

# 1. Instalamos utilidades runtime + binarios del pipeline multimedia
RUN apk add --no-cache curl ffmpeg exiftool python3 py3-opencv opencv

# 2. Copiamos los package.json para poder instalar en el runner (solo servidor y compartido)
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# 3. Instalamos herramientas de compilación virtuales, corremos npm ci de producción
# y limpiamos las herramientas virtuales en la misma capa
RUN apk add --no-cache --virtual .build-deps make g++ && \
    npm ci --omit=dev && \
    apk del .build-deps

# 4. Copiamos las carpetas compiladas (dist) generadas en la fase de builder
COPY --from=builder /home/node/app/shared/dist ./shared/dist
COPY --from=builder /home/node/app/server/dist ./server/dist
COPY --from=builder /home/node/app/client/dist ./client/dist

# 5. Aseguramos la propiedad de toda la estructura de usuario para 'node'
RUN chown -R node:node /home/node

# 6. Cambiamos al usuario sin privilegios
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
