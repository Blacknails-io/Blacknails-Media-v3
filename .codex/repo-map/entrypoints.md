# Entrypoints

## Package Scripts

| manifest | name | command |
| --- | --- | --- |
| client/package.json | dev | vite |
| client/package.json | build | tsc -b && vite build |
| client/package.json | lint | oxlint |
| client/package.json | test:e2e | playwright test |
| client/package.json | preview | vite preview |
| server/package.json | build | rimraf dist && tsc |
| server/package.json | test | node --import tsx --test tests/**/*.test.ts |
| server/package.json | start | node dist/index.js |
| server/package.json | dev | node --import=tsx --watch src/index.ts |
| shared/package.json | build | tsc |
| shared/package.json | watch | tsc -w |

## Detected Entrypoints

- client/src/lab/liquid-glass/index.ts
  Type: boot-file
  Confidence: medium
  Evidence:
  - client/src/lab/liquid-glass/index.ts

- client/src/main.tsx
  Type: boot-file
  Confidence: medium
  Evidence:
  - client/src/main.tsx

- client/src/presentation/themes/realistic-cyber-glass/glass/index.ts
  Type: boot-file
  Confidence: medium
  Evidence:
  - client/src/presentation/themes/realistic-cyber-glass/glass/index.ts

- client/src/presentation/ui/surfaces/LiquidGlassSurface/index.ts
  Type: boot-file
  Confidence: medium
  Evidence:
  - client/src/presentation/ui/surfaces/LiquidGlassSurface/index.ts

- client/src/presentation/views/auth/Login/index.ts
  Type: boot-file
  Confidence: medium
  Evidence:
  - client/src/presentation/views/auth/Login/index.ts

- client/src/services/api/index.ts
  Type: boot-file
  Confidence: medium
  Evidence:
  - client/src/services/api/index.ts

- server/src/index.ts
  Type: boot-file
  Confidence: medium
  Evidence:
  - server/src/index.ts

- shared/index.ts
  Type: boot-file
  Confidence: medium
  Evidence:
  - shared/index.ts

- docker-compose.yml
  Type: container-entrypoint
  Confidence: high
  Evidence:
  - docker-compose.yml

- server/Dockerfile
  Type: container-entrypoint
  Confidence: high
  Evidence:
  - server/Dockerfile

- npm script build
  Type: package-script
  Confidence: high
  Evidence:
  - client/package.json
  - rimraf dist && tsc
  - server/package.json
  - shared/package.json
  - tsc
  - tsc -b && vite build

- npm script dev
  Type: package-script
  Confidence: high
  Evidence:
  - client/package.json
  - node --import=tsx --watch src/index.ts
  - server/package.json
  - vite

- npm script lint
  Type: package-script
  Confidence: high
  Evidence:
  - client/package.json
  - oxlint

- npm script start
  Type: package-script
  Confidence: high
  Evidence:
  - node dist/index.js
  - server/package.json

- npm script test
  Type: package-script
  Confidence: high
  Evidence:
  - node --import tsx --test tests/**/*.test.ts
  - server/package.json

- npm script test:e2e
  Type: package-script
  Confidence: high
  Evidence:
  - client/package.json
  - playwright test
