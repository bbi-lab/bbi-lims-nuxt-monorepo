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
