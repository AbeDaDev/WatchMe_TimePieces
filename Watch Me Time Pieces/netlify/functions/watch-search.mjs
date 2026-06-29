import { getWatchSearchResults, getWatchShowcase } from '../../watch-search-core.mjs'

export async function handler(event) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: { message: 'Missing OPENAI_API_KEY.' } }),
      }
    }

    const query = (event.queryStringParameters?.q || '').trim()
    const limit = Number(event.queryStringParameters?.limit || 6)
    const mode = (event.queryStringParameters?.mode || '').trim()

    if (!query && mode !== 'showcase') {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: { message: 'Missing search query.' } }),
      }
    }

    const items =
      mode === 'showcase'
        ? await getWatchShowcase(apiKey)
        : await getWatchSearchResults(query, apiKey, { limit })

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
      body: JSON.stringify({ data: items }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Unable to search watches right now.',
        },
      }),
    }
  }
}
