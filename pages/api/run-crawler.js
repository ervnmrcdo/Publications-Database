import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createPagesServerClient } from '@/lib/supabase/pager-server';

const execFileAsync = promisify(execFile);

function normalizePublication(pub) {
  return {
    type: pub.publication_type || null,
    title: pub.title || null,
    publisher: pub.publisher || null,
    publication_status: 'Published',
    date_published: pub.date_of_publication || null,
    issue_number: pub.issue || null,
    page_numbers: pub.pages || null,
    volume_number: pub.volume || null,
    journal_name: pub.journal || null,
    doi: pub.doi || null,
  };
}

async function findExistingPublicationId(supabase, normalized) {
  if (normalized.doi) {
    const { data } = await supabase
      .from('publications')
      .select('publication_id')
      .eq('doi', normalized.doi)
      .limit(1)
      .maybeSingle();

    if (data?.publication_id) {
      return data.publication_id;
    }
  }

  const { data } = await supabase
    .from('publications')
    .select('publication_id')
    .eq('title', normalized.title)
    .eq('date_published', normalized.date_published)
    .eq('journal_name', normalized.journal_name)
    .limit(1)
    .maybeSingle();

  return data?.publication_id ?? null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      stdout: '',
      stderr: '',
      message: 'Method not allowed',
    });
  }

  const scriptPath = path.join(process.cwd(), 'crawler.js');
  const supabase = createPagesServerClient(req, res);

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return res.status(401).json({
        ok: false,
        stdout: '',
        stderr: '',
        message: 'Unauthorized',
      });
    }

    const userId = authData.user.id;

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('scopus_author_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        ok: false,
        stdout: '',
        stderr: '',
        message: `Failed to load user profile: ${profileError.message}`,
      });
    }

    const authorId = userProfile?.scopus_author_id;
    if (!authorId) {
      return res.status(400).json({
        ok: false,
        stdout: '',
        stderr: '',
        message: 'Missing scopus_author_id in profile. Update your profile first.',
      });
    }

    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, String(authorId), '--json'], {
      cwd: process.cwd(),
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const crawlerResult = JSON.parse(stdout || '{}');
    const publications = Array.isArray(crawlerResult.publications)
      ? crawlerResult.publications
      : [];

    let insertedPublications = 0;
    let linkedPublications = 0;

    for (const pub of publications) {
      const normalized = normalizePublication(pub);
      if (!normalized.title) {
        continue;
      }

      let publicationId = await findExistingPublicationId(supabase, normalized);

      if (!publicationId) {
        const { data: created, error: createError } = await supabase
          .from('publications')
          .insert([normalized])
          .select('publication_id')
          .single();

        if (createError || !created?.publication_id) {
          console.warn('[run-crawler] failed to insert publication:', normalized.title, createError?.message);
          continue;
        }

        publicationId = created.publication_id;
        insertedPublications += 1;
      }

      const { error: linkError } = await supabase
        .from('publication_authors')
        .upsert(
          [
            {
              publication_id: publicationId,
              user_id: userId,
            },
          ],
          { onConflict: 'publication_id,user_id' }
        );

      if (!linkError) {
        linkedPublications += 1;
      }
    }

    if (stdout) {
      console.log('[run-crawler] stdout:\n', stdout);
    }
    if (stderr) {
      console.warn('[run-crawler] stderr:\n', stderr);
    }

    return res.status(200).json({
      ok: true,
      stdout: stdout || '',
      stderr: stderr || '',
      summary: {
        fetchedPublications: publications.length,
        insertedPublications,
        linkedPublications,
        failedEids: Array.isArray(crawlerResult.failedEids) ? crawlerResult.failedEids.length : 0,
      },
    });
  } catch (error) {
    console.error('[run-crawler] execution failed:', error?.message || error);

    return res.status(500).json({
      ok: false,
      stdout: error?.stdout || '',
      stderr: error?.stderr || '',
      message: error?.message || 'Failed to execute crawler script',
    });
  }
}
