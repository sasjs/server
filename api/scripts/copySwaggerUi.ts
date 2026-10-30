import path from 'path'

import { copySwaggerUiAssets } from '../src/utils/swaggerUiAssets'

// Runs from `npm run initial`, so the assets are in place for both the dev server
// (which serves api/public directly under ts-node) and the packaged build (which
// copies api/public into build/public). The generated files are gitignored: the
// installed swagger-ui-dist devDependency is the only source of truth.
const destination = path.resolve(__dirname, '..', 'public', 'SASjsApi')

copySwaggerUiAssets(destination)

console.log(`Copied Swagger UI assets to ${destination}`)
