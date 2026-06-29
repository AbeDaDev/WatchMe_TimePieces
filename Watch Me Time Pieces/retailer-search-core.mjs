import OpenAI from 'openai'

function parseRetailerJson(text) {
  const trimmed = text.trim()
  const cleaned = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  return JSON.parse(cleaned)
}

export async function findNearbyRetailer({
  watchTitle,
  latitude,
  longitude,
  locationLabel,
  apiKey,
  model = process.env.OPENAI_MODEL || 'gpt-5.5',
}) {
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY.')
  }

  const client = new OpenAI({ apiKey })

  const locationSummary = latitude != null && longitude != null
    ? `Latitude: ${latitude}, Longitude: ${longitude}`
    : locationLabel
      ? `City or area: ${locationLabel}`
      : 'Location unavailable. Use the best available nearby option and say the location is approximate.'

  const response = await client.responses.create({
    model,
    tools: [{ type: 'web_search' }],
    input: [
      `Find one real nearby retailer that is likely to sell or service this watch model: ${watchTitle}.`,
      `User location context: ${locationSummary}.`,
      'Prefer an authorized dealer or reputable luxury watch retailer within about 50 miles if possible.',
      'Use web search to verify the retailer is real and currently active.',
      'Return only valid JSON with these keys: retailerName, retailerType, address, city, region, postalCode, country, website, phone, distanceMiles, confidence, notes, sourceSummary.',
      'Use null for unknown optional fields. confidence must be one of "high", "medium", or "low".',
      'If no exact nearby retailer can be verified, return the best nearby likely retailer and explain the limitation in notes.',
    ].join('\n'),
  })

  const outputText = response.output_text || ''

  if (!outputText.trim()) {
    throw new Error('OpenAI returned no retailer details.')
  }

  const retailer = parseRetailerJson(outputText)

  return {
    retailer,
    rawText: outputText,
  }
}
