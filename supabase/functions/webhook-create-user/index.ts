// Supabase Edge Function: webhook-create-user
// Deploy: supabase functions deploy webhook-create-user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verify webhook secret
        const webhookSecret = req.headers.get('x-webhook-secret')
        const expectedSecret = Deno.env.get('WEBHOOK_SECRET')

        if (webhookSecret !== expectedSecret) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse request body
        const { name, email, password, role = 'STUDENT', phone, companyName } = await req.json()

        // Validate required fields
        if (!name || !email || !password) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: name, email, password' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Create user in auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: { name, role, phone, companyName }
        })

        if (authError) {
            throw authError
        }

        // Profile will be created automatically by database trigger
        // Wait a moment for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verify profile was created
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

        if (profileError || !profile) {
            console.error('Profile not created by trigger:', profileError)
            // Clean up auth user if profile creation failed
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            throw new Error('Failed to create user profile')
        }

        // Trigger webhook event (user created)
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': expectedSecret || ''
            },
            body: JSON.stringify({
                event: 'user.created',
                data: {
                    id: authData.user.id,
                    name,
                    email,
                    role,
                    createdAt: new Date().toISOString()
                }
            })
        }).catch(err => console.error('Failed to trigger webhook:', err))

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: authData.user.id,
                    name,
                    email,
                    role
                }
            }),
            {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
