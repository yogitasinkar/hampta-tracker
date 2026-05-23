// ===========================================================================
// Supabase Edge Function: recalibrate
// Calls the Claude API to adjust the upcoming week of training based on the
// trekker's progress. The API key lives here as a Supabase secret, so it is
// NEVER exposed in the browser.
//
// Deploy:  supabase functions deploy recalibrate
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ===========================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { displayName, baseline, checkins, weeksRemaining, currentWeekPlan } =
      await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500)
    }

    const system = [
      'You are an expert mountaineering fitness coach.',
      'You adjust a one-week training block for a trekker preparing for the',
      'Hampta Pass trek in the Indian Himalayas (tops out ~14,100 ft / 4,300 m;',
      'summit day is a steep snow climb plus a ~2,000 ft knee-heavy descent;',
      '4-5 back-to-back trekking days carrying a daypack). The trek begins',
      'June 29. Four training pillars: endurance, leg/descent strength, incline',
      'work, load carrying. Always include one full rest day. Respect pain',
      'flags by reducing load and adding recovery. Taper in the final week.',
      'Respond with ONLY a JSON object, no markdown, no preamble. Shape:',
      '{"summary": string, "week": [{"day": number, "focus": string,',
      '"detail": string, "pillar": "endurance"|"strength"|"incline"|"load"|"rest",',
      '"rest": boolean}]}. The week array must have exactly 7 day objects.',
    ].join(' ')

    const userMsg = JSON.stringify({
      trekker: displayName,
      baseline,
      recentCheckins: checkins,
      weeksRemainingUntilTrek: weeksRemaining,
      currentWeekPlan,
      instruction:
        'Produce the next week of training, adjusted for how the recent ' +
        'check-ins went. If effort/soreness are high or a pain flag is set, ' +
        'reduce volume and intensity. If the week felt easy and adherence is ' +
        'good, progress sensibly. Keep it specific and actionable.',
    })

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })

    const data = await resp.json()
    if (!resp.ok) {
      return json({ error: 'Claude API error', detail: data }, 502)
    }

    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .replace(/```json|```/g, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return json({ error: 'Could not parse Claude response', raw: text }, 502)
    }

    return json(parsed, 200)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
