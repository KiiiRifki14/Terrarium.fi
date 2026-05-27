import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Variatif notification templates
const templates = {
  'H-3': [
    { title: '🌿 Eh, inget lho!', body: 'Cicilan {name} jatuh tempo 3 hari lagi. Rp {amount} siap-siap ya!' },
    { title: '💸 Heads up!', body: '{name} nagih 3 hari lagi nih. Pastiin {wallet} kamu cukup ya.' },
    { title: '🗓️ Pengingat santai', body: 'Tanggal {due} udah deket. Cicilan {name} Rp {amount} menanti~' },
  ],
  'H-1': [
    { title: '⚠️ Besok jatuh tempo!', body: 'Cicilan {name} Rp {amount} harus dibayar besok. Jangan lupa!' },
    { title: '🔔 Hampir waktunya!', body: 'Besok hari H buat bayar {name}. Transfer dari {wallet} sekarang?' },
    { title: '😬 Psst!', body: 'Cicilan {name} besok lho. Rp {amount} dari {wallet} — biar tenang!' },
  ],
  'H-0': [
    { title: '🚨 Hari ini jatuh tempo!', body: 'Bayar cicilan {name} Rp {amount} hari ini ya. Jangan sampai telat!' },
    { title: '💳 Ini harinya!', body: '{name} nunggu pembayaran Rp {amount} dari kamu hari ini.' },
    { title: '🌱 Jaga reputasimu!', body: 'Cicilan {name} jatuh tempo HARI INI. Rp {amount} — yuk selesaikan!' },
  ],
};

function fillTemplate(template, vars) {
  return {
    title: template.title.replace('{name}', vars.name).replace('{amount}', vars.amount).replace('{wallet}', vars.wallet).replace('{due}', vars.due),
    body: template.body.replace('{name}', vars.name).replace('{amount}', vars.amount).replace('{wallet}', vars.wallet).replace('{due}', vars.due),
  };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getNextDueDate(dueDayOfMonth) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDayOfMonth);
  if (thisMonth < now) {
    // Due date has passed this month, so next month
    return new Date(now.getFullYear(), now.getMonth() + 1, dueDayOfMonth);
  }
  return thisMonth;
}

function daysDiff(dateA, dateB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dateA - dateB) / msPerDay);
}

export async function GET(req) {
  // Verify secret header for Vercel Cron security
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all active installment debts
    const { data: debts, error: debtError } = await supabase
      .from('debts')
      .select('*, wallets(name)')
      .eq('status', 'active')
      .eq('is_installment', true)
      .not('installment_due_day', 'is', null);

    if (debtError) throw debtError;
    if (!debts || debts.length === 0) {
      return NextResponse.json({ message: 'No active installment debts', sent: 0 });
    }

    // Fetch all push subscriptions
    const { data: subs, error: subError } = await supabase.from('push_subscriptions').select('*');
    if (subError) throw subError;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscribers', sent: 0 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalSent = 0;
    const notifications = [];

    for (const debt of debts) {
      const nextDue = getNextDueDate(debt.installment_due_day);
      nextDue.setHours(0, 0, 0, 0);
      const daysLeft = daysDiff(nextDue, today);

      let templateKey = null;
      if (daysLeft === 3) templateKey = 'H-3';
      else if (daysLeft === 1) templateKey = 'H-1';
      else if (daysLeft === 0) templateKey = 'H-0';

      if (!templateKey) continue;

      const template = pickRandom(templates[templateKey]);
      const remainingAmount = parseFloat(debt.total_amount) - parseFloat(debt.paid_amount);
      const vars = {
        name: debt.contact_name,
        amount: Math.round(debt.installment_amount || remainingAmount).toLocaleString('id-ID'),
        wallet: debt.wallets?.name || 'dompetmu',
        due: nextDue.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }),
      };

      const filled = fillTemplate(template, vars);
      notifications.push({ ...filled, tag: `debt-${debt.id}`, url: '/?tab=hutang' });
    }

    // Send all notifications
    const sendPromises = notifications.flatMap((notif) =>
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(notif)
        ).catch(() => null) // Ignore individual failures
      )
    );

    await Promise.allSettled(sendPromises);
    totalSent = notifications.length;

    return NextResponse.json({ success: true, notificationsSent: totalSent, debtCount: notifications.length });
  } catch (err) {
    console.error('Debt reminder cron error:', err);
    return NextResponse.json({ error: 'Cron failed: ' + err.message }, { status: 500 });
  }
}
