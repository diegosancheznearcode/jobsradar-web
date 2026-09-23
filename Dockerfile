# syntax=docker/dockerfile:1
#
# Two stages:
#
#   build   : installs and compiles the vite bundle
#   runtime : nginx serving only the static output — this is what Cloud Run runs
#
# @nearcodecr/jobsradar-contracts is a private GitHub Package (see .npmrc), so
# `pnpm install` needs a read:packages token. It is passed as a BuildKit
# secret mount, not a --build-arg: a build-arg gets baked into the image's
# layer history and would leak the token to anyone who can pull the image.
#
#   DOCKER_BUILDKIT=1 docker build \
#     --secret id=npm_token,env=NODE_AUTH_TOKEN \
#     --build-arg VITE_API_URL=https://... \
#     -t jobsradar-web .

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=secret,id=npm_token \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/npm_token)" >> .npmrc && \
    pnpm install --frozen-lockfile

COPY . .

# vite inlines import.meta.env into the bundle at build time, so the API's URL
# is a build input, not a runtime one. Cloud Build passes it from the
# _API_URL substitution, which Terraform wires to jobsradar-api's own run.app
# URL (see cicd.tf in nearcode-infra) — it cannot drift from what is deployed.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
