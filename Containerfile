# ---- Etapa 1: Dependencias ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# ---- Etapa 2: Construcción (Build) ----
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
RUN npm install -g pnpm && pnpm build

# ---- Etapa 3: Producción ----
FROM node:20-slim AS runner
WORKDIR /app

# Creamos un usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Instalamos pnpm globalmente en la etapa final para que esté disponible
RUN npm install -g pnpm

# Copiamos solo los artefactos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Cambiamos al usuario no-root
USER nextjs
EXPOSE 3000

# 1. Anulamos el ENTRYPOINT por defecto de la imagen de Node
ENTRYPOINT []
# 2. el CMD se ejecutará directamente, sin "node" delante
CMD ["pnpm", "start"]