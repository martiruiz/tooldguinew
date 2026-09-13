import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Apollo.io people search
async function apolloPeopleSearch(params: {
  company?: string; title?: string; location?: string; apiKey: string
}) {
  const body: any = {
    api_key: params.apiKey, page: 1, per_page: 25,
    person_titles: params.title ? [params.title] : [],
    organization_locations: params.location ? [params.location] : [],
  }
  if (params.company) body.q_organization_name = params.company
  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return (json.people || []).map((p: any) => ({
    first_name: p.first_name || '', last_name: p.last_name || '',
    email: p.email || '', position: p.title || '',
    linkedin_url: p.linkedin_url || '',
    phone: p.phone_numbers?.[0]?.sanitized_number || '',
    company: p.organization?.name || '',
    company_domain: p.organization?.primary_domain || '',
    source: 'apollo', confidence: null,
    photo_url: p.photo_url || '', city: p.city || '', country: p.country || '',
  }))
}

// Google Maps Places API (New) — single call returns phone + website
async function googleMapsSearch(query: string, location: string, apiKey: string) {
  const textQuery = [query, location].filter(Boolean).join(' ')

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.internationalPhoneNumber,places.websiteUri',
    },
    body: JSON.stringify({ textQuery, languageCode: 'ca', maxResultCount: 15 }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || 'Error consultant Google Maps')

  return (json.places || []).map((p: any) => {
    const name = p.displayName?.text || ''
    const addr = p.formattedAddress || ''
    const website = p.websiteUri || ''
    const phone = p.internationalPhoneNumber || ''
    const domain = website ? (() => { try { return new URL(website).hostname.replace('www.', '') } catch { return '' } })() : ''
    const parts = addr.split(',')
    const city = parts.length >= 2 ? parts[parts.length - 2].trim() : ''
    const country = parts.length >= 1 ? parts[parts.length - 1].trim() : ''

    return {
      company: name,
      address: addr,
      phone,
      website,
      company_domain: domain,
      email: '',
      maps_url: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
      city,
      country,
      rating: p.rating || null,
      ratings_count: p.userRatingCount || null,
      osm_type: p.types?.[0] || '',
      source: 'googlemaps',
      first_name: '', last_name: '', position: '',
      linkedin_url: '', confidence: null,
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { provider, apolloKey, mapsApiKey, company, title, location, mapsQuery, mapsLocation } = body

    let results: any[] = []

    if (provider === 'apollo') {
      if (!apolloKey) return NextResponse.json({ error: 'Falta la clau API d\'Apollo.io' }, { status: 400 })
      results = await apolloPeopleSearch({ company, title, location, apiKey: apolloKey })
    } else if (provider === 'googlemaps') {
      if (!mapsApiKey) return NextResponse.json({ error: 'Falta la clau API de Google Maps. Configura-la a \'Claus API\'.' }, { status: 400 })
      if (!mapsQuery) return NextResponse.json({ error: 'Introdueix un tipus de negoci a cercar' }, { status: 400 })
      results = await googleMapsSearch(mapsQuery, mapsLocation || '', mapsApiKey)
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
