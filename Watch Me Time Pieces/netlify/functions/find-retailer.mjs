import { findNearbyRetailer } from '../../retailer-search-core.mjs'

export async function handler(event) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    const watchTitle = (event.queryStringParameters?.watch || '').trim()
    const latitude = event.queryStringParameters?.lat
      ? Number(event.queryStringParameters.lat)
      : null
    const longitude = event.queryStringParameters?.lng
      ? Number(event.queryStringParameters.lng)
      : null
    const locationLabel = (event.queryStringParameters?.location || '').trim()

    if (!watchTitle) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: { message: 'Missing watch title.' } }),
      }
    }

    const result = await findNearbyRetailer({
      watchTitle,
      latitude,
      longitude,
      locationLabel,
      apiKey,
    })

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
      body: JSON.stringify(result),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: {
          message:
            error instanceof Error ? error.message : 'Unable to find a nearby retailer right now.',
        },
      }),
    }
  }
}
