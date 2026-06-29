import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { getWatchSearchResults, getWatchShowcase } from './watch-search-core.mjs'
import { findNearbyRetailer } from './retailer-search-core.mjs'

function loadLocalEnvValue(name) {
  try {
    const envText = readFileSync(new URL('./.env', import.meta.url), 'utf8')
    const match = envText.match(new RegExp(`^${name}=(.+)$`, 'm'))
    return match?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'watch-search-dev-route',
      configureServer(server) {
        server.middlewares.use('/.netlify/functions/watch-search', async (req, res, next) => {
          try {
            const url = new URL(req.url, 'http://localhost')
            const query = url.searchParams.get('q') || ''
            const limit = Number(url.searchParams.get('limit') || 6)
            const mode = url.searchParams.get('mode') || ''
            const apiKey = loadLocalEnvValue('OPENAI_API_KEY')

            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: { message: 'Missing OPENAI_API_KEY.' } }))
              return
            }

            const data =
              mode === 'showcase'
                ? await getWatchShowcase(apiKey)
                : await getWatchSearchResults(query, apiKey, { limit })

            res.statusCode = 200
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ data }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                error: {
                  message:
                    error instanceof Error
                      ? error.message
                      : 'Unable to search watches right now.',
                },
              }),
            )
          }
        })
        server.middlewares.use('/.netlify/functions/find-retailer', async (req, res, next) => {
          try {
            const url = new URL(req.url, 'http://localhost')
            const watchTitle = url.searchParams.get('watch') || ''
            const latitude = url.searchParams.get('lat')
              ? Number(url.searchParams.get('lat'))
              : null
            const longitude = url.searchParams.get('lng')
              ? Number(url.searchParams.get('lng'))
              : null
            const locationLabel = url.searchParams.get('location') || ''
            const apiKey = loadLocalEnvValue('OPENAI_API_KEY')

            const result = await findNearbyRetailer({
              watchTitle,
              latitude,
              longitude,
              locationLabel,
              apiKey,
            })

            res.statusCode = 200
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                error: {
                  message:
                    error instanceof Error
                      ? error.message
                      : 'Unable to find a nearby retailer right now.',
                },
              }),
            )
          }
        })
      },
    },
  ],
})
