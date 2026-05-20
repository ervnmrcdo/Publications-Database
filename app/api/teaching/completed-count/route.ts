import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 })
  }

  const supabase = await createClient()

  const { count, error } = await supabase
    .from('submissions')
    .select('submission_id', { count: 'exact', head: true })
    .eq('submitter_id', userId)
    .in('status', ['VALIDATED', 'SUBMITTED_TO_HIGHER_OFFICE', 'PROCESSED_BY_HIGHER_OFFICE'])

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ count: count || 0 })
}