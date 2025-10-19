# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20.17.0

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /workspace

FROM node:${NODE_VERSION} AS client-deps
WORKDIR /workspace
COPY client/package.json client/package-lock.json ./client/
RUN npm --prefix client ci
COPY client ./client
RUN npm --prefix client run build

FROM node:${NODE_VERSION}-slim AS server-deps
WORKDIR /workspace
COPY server/package.json server/package-lock.json ./server/
RUN npm --prefix server ci --omit=dev

FROM node:${NODE_VERSION}-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

COPY --from=server-deps --chown=node:node /workspace/server/node_modules ./server/node_modules
COPY --chown=node:node server ./server
COPY --chown=node:node Builtattic_Demo_Agreement.docx ./Builtattic_Demo_Agreement.docx
COPY --from=client-deps --chown=node:node /workspace/client/dist ./client/dist

USER node

EXPOSE 8080
CMD ["node", "server/src/index.js"]
