
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create Supabase Client with Service Role Key
    // This allows the function to bypass RLS and perform admin actions
    const supabase = createClient(
      "https://tqjfcbulgtoimroqyxlo.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
    )

    // 2. Verify the calling user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '').trim()
    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Check admin role
    const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 3. Handle Request Methods
    switch (req.method) {
      case 'GET': {
        // List all users
        const { data: { users }, error } = await supabase.auth.admin.listUsers()
        if (error) throw error
        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      
      case 'POST': {
        // Create a new user
        const body = await req.json()
        const { email, password, user_metadata } = body
        
        if (!email || !password) {
          throw new Error('Email and password are required')
        }

        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: user_metadata || { role: 'user' }
        })
        
        if (error) throw error
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'PUT': {
        // Update a user
        const body = await req.json()
        const { id, attributes } = body
        
        if (!id || !attributes) {
          throw new Error('User ID and attributes are required')
        }

        const { data, error } = await supabase.auth.admin.updateUserById(id, attributes)
        if (error) throw error
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'DELETE': {
        // Delete a user
        const body = await req.json()
        const { user_id } = body
        
        if (!user_id) {
          throw new Error('User ID is required')
        }

        const { data, error } = await supabase.auth.admin.deleteUser(user_id)
        if (error) throw error
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        })
    }
  } catch (error) {
    console.error('Edge Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

