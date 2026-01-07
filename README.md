# Example Monorepo with Nuxt Layers



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
