import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(req) {
  try {
    const { title, body, tag, url } = await req.json();

    // Fetch all push subscriptions
    const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscribers', sent: 0 });
    }

    const payload = JSON.stringify({ title, body, tag: tag || 'terrarium', url: url || '/' });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Clean up failed/expired subscriptions
    if (failed > 0) {
      const failedEndpoints = results
        .map((r, i) => (r.status === 'rejected' ? subs[i].endpoint : null))
        .filter(Boolean);
      await supabase.from('push_subscriptions').delete().in('endpoint', failedEndpoints);
    }

    return NextResponse.json({ success: true, sent, failed });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
