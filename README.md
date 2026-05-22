# BBI LIMS Monorepo with Nuxt Layers

A monorepo for building multiple customized LIMS applications using Nuxt Layers. Shared components, composables, utilities, types, and configuration are defined in reusable layers and extended by individual apps — enabling teams to maintain a common foundation while tailoring each LIMS deployment to its specific requirements.

Based on the example repo from the Nuxt team: https://github.com/nuxt/example-layers-monorepo


### Instal dependencies for all layers

From project root:
```
pnpm i
```

### Add new dependency to a layer

From project root:
```
pnpm add --filter <layer-name> <package-name>
```


### Running a layer/app locally

```
cd packages/<layer-name>
pnpm run dev
```

### Running/generating database migrations

```
cd packages/<layer-name>
pnpm run drizzle-kit push
```
```
pnpm run drizzle-kit generate
```


### Docker

Build docker container for a specific layer (`labelseq-lims-app` in the following examples):
```
docker build -f packages/labelseq-lims-app/Dockerfile --tag labelseq-lims .
```

Or for a specific architecture (e.g. linux/arm64):
```
docker build --platform linux/arm64 -f packages/labelseq-lims-app/Dockerfile --tag labelseq-lims .
```

Copy `.env.example` to `.env.docker` and change the database URL's host from `localhost` to `host.docker.internal`. Set other environment variables as needed.

Start the docker container:
```
docker run -p 3000:3000 --env-file /packages/labelseq-lims/.env.docker labelseq-lims
```
