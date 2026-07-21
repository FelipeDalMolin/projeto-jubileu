FROM node:22-alpine AS build

WORKDIR /app
COPY frontend/jubileu-web/package.json frontend/jubileu-web/package-lock.json ./
RUN npm ci
COPY frontend/jubileu-web/ .
RUN npm run build

FROM nginx:1.27-alpine

ARG RELEASE_REF=development
ARG GIT_SHA=unknown
ARG ALEMBIC_EXPECTED_REVISION=0020_auth_sessions_rollback_safe

LABEL org.opencontainers.image.title="Jubileu Web" \
      org.opencontainers.image.version=$RELEASE_REF \
      org.opencontainers.image.revision=$GIT_SHA \
      io.jubileu.alembic.revision=$ALEMBIC_EXPECTED_REVISION

COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/nginx/jubileu.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
