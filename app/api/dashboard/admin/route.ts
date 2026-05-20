import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const [pendingResult, teachingResult, nonTeachingResult] = await Promise.all([
    (async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('submission_id', { count: 'exact', head: true })
        .eq('status', 'PENDING')
      return { count: data, error, countValue: error ? 0 : (data as unknown as number) || 0 }
    })(),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teaching'),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'nonteaching'),
  ])

  const pendingCount = typeof pendingResult.countValue === 'number' ? pendingResult.countValue : 0

  return Response.json({
    pendingCount,
    teachingCount: teachingResult.count || 0,
    nonTeachingCount: nonTeachingResult.count || 0,
  })
}