ARG NODE_VERSION=24.11.1

FROM node:${NODE_VERSION}-slim AS base

ARG PORT=3000

WORKDIR /src

# Build
FROM base AS build

COPY --link package.json /src/
COPY --link pnpm-lock.yaml /src/
COPY --link pnpm-workspace.yaml /src/

# Copy package.json files first so pnpm can resolve the workspace before installing
COPY --link packages/labelseq-lims-app/package.json /src/packages/labelseq-lims-app/
COPY --link packages/lims-layer/package.json /src/packages/lims-layer/
COPY --link packages/base-layer/package.json /src/packages/base-layer/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy full source after install
COPY --link packages/labelseq-lims-app /src/packages/labelseq-lims-app
COPY --link packages/lims-layer /src/packages/lims-layer
COPY --link packages/base-layer /src/packages/base-layer

WORKDIR /src/packages/labelseq-lims-app

RUN pnpm run build

# Run
FROM base

ENV PORT=$PORT
ENV NODE_ENV=production

WORKDIR /src/packages/labelseq-lims-app

COPY --from=build /src/packages/labelseq-lims-app/.output /src/packages/labelseq-lims-app/.output
# Optional, only needed if you rely on unbundled dependencies
COPY --from=build /src/packages/labelseq-lims-app/node_modules /src/packages/labelseq-lims-app/node_modules

CMD [ "node", ".output/server/index.mjs" ]
