import OpenAI from 'openai'

const WATCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    watches: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          badge: { type: 'string' },
          brand: { type: 'string' },
          model: { type: 'string' },
          detail: { type: 'string' },
          description: { type: 'string' },
          meta: {
            type: 'array',
            items: { type: 'string' },
          },
          priceLabel: { type: 'string' },
          imageUrl: { type: ['string', 'null'] },
          imageAlt: { type: ['string', 'null'] },
          sourceUrl: { type: ['string', 'null'] },
        },
        required: [
          'title',
          'badge',
          'brand',
          'model',
          'detail',
          'description',
          'meta',
          'priceLabel',
          'imageUrl',
          'imageAlt',
          'sourceUrl',
        ],
      },
    },
  },
  required: ['watches'],
}

function createClient(apiKey) {
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY.')
  }

  return new OpenAI({ apiKey })
}

function buildPrompt({ query, limit, showcase }) {
  if (showcase) {
    return `
Return exactly 3 watches for a luxury watch homepage showcase.

Use these exact badges in order:
1. Featured
2. Best Seller
3. Popular

Use these exact watches in order:
1. Rolex Air-King
2. Omega Seamaster Diver 300M
3. Breitling Navitimer B01

For each watch, provide:
- the exact watch name as title
- brand
- model
- a short retail price label in USD
- a concise description
- 2 to 4 useful meta facts
- an imageUrl if you can find a publicly accessible product or press image URL
- a sourceUrl to the most useful official or retailer page

Keep the descriptions factual and avoid marketing fluff. If a direct image URL cannot be found, use null for imageUrl.
`
  }

  return `
Search the web for real watches that best match: "${query}".

Return up to ${limit} results.

For each watch, provide:
- the exact watch name as title
- badge set to "Watch"
- brand
- model
- a short retail price label in USD
- a concise description
- 2 to 4 useful meta facts
- an imageUrl if you can find a publicly accessible product or press image URL
- a sourceUrl to the most useful official or retailer page

Prefer exact matches and closely related models from recognizable brands. Avoid duplicates.
If a direct image URL cannot be found, use null for imageUrl.
`
}

function parseWatchResponse(responseText) {
  if (!responseText) {
    throw new Error('OpenAI returned an empty response.')
  }

  const trimmed = responseText.trim()
  const cleaned = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    : trimmed

  const parsed = JSON.parse(cleaned)

  if (!parsed || !Array.isArray(parsed.watches)) {
    throw new Error('OpenAI did not return a watch list.')
  }

  return parsed.watches
}

function normalizeWatchItem(item) {
  const title = item.title || [item.brand, item.model].filter(Boolean).join(' ') || 'Unnamed watch'

  return {
    title,
    badge: item.badge || item.brand || 'Watch',
    brand: item.brand || item.title || 'Watch',
    model: item.model || item.title || 'Unknown model',
    detail: item.detail || item.priceLabel || 'Price unavailable',
    description:
      item.description ||
      'No watch description was returned by OpenAI.',
    meta: Array.isArray(item.meta) ? item.meta.filter(Boolean) : [],
    priceLabel: item.priceLabel || item.detail || 'Price unavailable',
    imageUrl: item.imageUrl || null,
    imageAlt: item.imageAlt || title,
    sourceUrl: item.sourceUrl || null,
  }
}

async function requestWatchCards({ apiKey, query, limit = 6, showcase = false }) {
  const client = createClient(apiKey)
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.5',
    tools: [{ type: 'web_search' }],
    tool_choice: 'required',
    text: {
      format: {
        type: 'json_schema',
        name: showcase ? 'watch_showcase' : 'watch_search_results',
        strict: true,
        schema: WATCH_SCHEMA,
      },
    },
    input: [
      {
        role: 'developer',
        content:
          'You are a luxury watch research assistant. Return only the requested JSON. Use real, current, publicly verifiable watch details.',
      },
      {
        role: 'user',
        content: buildPrompt({ query, limit, showcase }),
      },
    ],
  })

  const watches = parseWatchResponse(response.output_text)
  return watches.map(normalizeWatchItem)
}

export async function getWatchSearchResults(query, apiKey, options = {}) {
  const trimmed = `${query || ''}`.trim()

  if (!trimmed && !options.showcase) {
    return []
  }

  return requestWatchCards({
    apiKey,
    query: trimmed || 'luxury watches',
    limit: options.limit ?? 6,
    showcase: Boolean(options.showcase),
  })
}

export async function getWatchShowcase(apiKey) {
  return requestWatchCards({
    apiKey,
    query: 'Rolex Air-King, Omega Seamaster Diver 300M, Breitling Navitimer B01',
    limit: 3,
    showcase: true,
  })
}
