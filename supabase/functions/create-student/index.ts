import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the caller is an authenticated teacher
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    ).auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Only teachers can create students' }), { status: 403, headers: corsHeaders })
    }

    const { name, registerNumber, department, yearSemester, batch, password } = await req.json()
    const systemEmail = `${registerNumber}@student.eduflow.com`

    // 1. Create Auth User
    const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
      email: systemEmail,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'student', name }
    })

    if (createError) throw createError

    // 2. Insert into students table
    const { error: dbError } = await supabaseClient
      .from('students')
      .insert({
        auth_user_id: authData.user.id,
        name,
        register_number: registerNumber,
        department,
        year_semester: yearSemester,
        batch
      })

    if (dbError) throw dbError

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})