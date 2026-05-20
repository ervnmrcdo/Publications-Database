import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const { user_id, file_name, file_data } = await request.json();

    if (!user_id || !file_name || !file_data) {
      return NextResponse.json({ error: 'user_id, file_name, and file_data are required' }, { status: 400 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const filePath = `${user_id}/${file_name}`;
    const buffer = Buffer.from(file_data, 'base64');

    const { error } = await supabaseAdmin.storage
      .from('signatures')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, path: filePath });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}