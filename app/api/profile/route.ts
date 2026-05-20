import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 })
  }

  const supabase = await createServerClient()
  
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('users')
    .select('first_name, middle_name, last_name, email, university, college, department, contact_number, position, signature_path, affiliation_path, scopus_author_id')
    .eq('id', userId)
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  let signatureUrl: string | null = null
  if (data.signature_path) {
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('signatures')
      .createSignedUrl(`${userId}/${userId}.png`, 3600)
    signatureUrl = signedUrlData?.signedUrl ?? null
  }

  let affiliationUrl: string | null = null
  if (data.affiliation_path) {
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('proof-of-affiliation')
      .createSignedUrl(`${userId}/${userId}.pdf`, 3600)
    affiliationUrl = signedUrlData?.signedUrl ?? null
  }

  return Response.json({ ...data, signatureUrl, affiliationUrl })
}