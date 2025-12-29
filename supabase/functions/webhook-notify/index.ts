// Supabase Edge Function: webhook-notify
// Deploy: supabase functions deploy webhook-notify

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { event, data } = await req.json()

        // Initialize Supabase Client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get all webhook subscriptions for this event
        const { data: webhooks, error } = await supabase
            .from('webhook_subscriptions')
            .select('*')
            .eq('event_type', event)
            .eq('active', true)

        if (error) throw error

        // Send webhook to all subscribers
        const results = await Promise.allSettled(
            (webhooks || []).map(async (webhook) => {
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Event': event,
                        'X-Webhook-Signature': await generateSignature(data, webhook.secret)
                    },
                    body: JSON.stringify({
                        event,
                        data,
                        timestamp: new Date().toISOString()
                    })
                })

                // Log webhook delivery
                await supabase.from('webhook_logs').insert({
                    subscription_id: webhook.id,
                    event_type: event,
                    status: response.ok ? 'success' : 'failed',
                    response_code: response.status,
                    payload: data
                })

                return { webhook: webhook.url, status: response.status }
            })
        )

        return new Response(
            JSON.stringify({
                success: true,
                delivered: results.filter(r => r.status === 'fulfilled').length,
                failed: results.filter(r => r.status === 'rejected').length,
                results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function generateSignature(data: any, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(JSON.stringify(data))

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}
