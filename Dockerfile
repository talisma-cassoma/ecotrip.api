# ---------- Etapa 1: Build ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependência
COPY package.json yarn.lock ./

# Instalar dependências (sem dev)
RUN yarn install --frozen-lockfile --production=false

# Copiar o restante do código
COPY . .

# Gerar cliente Prisma
RUN yarn prisma generate

# Compilar o código TypeScript
RUN yarn build

# ---------- Etapa 2: Produção ----------
FROM node:18-alpine

WORKDIR /app

# Instalar dependências de produção
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

# Copiar dist e prisma
COPY --from=builder /app/dist ./dist

COPY --from=builder /app/prisma ./prisma

# Executa prisma db push e inicia a API
#CMD [ "tail", "-f", "/dev/null" ]
CMD ["sh", "-c", "yarn prisma db push && node dist/main"]
