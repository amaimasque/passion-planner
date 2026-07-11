import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

// Credentials are stored via:
//   firebase functions:config:set gmail.user="thepassionplanner2026@gmail.com" gmail.pass="tjipuiqpdujxbanc"
function getTransporter() {
  const cfg = functions.config().gmail;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

// ── generateRsvpLink ──────────────────────────────────────────────────────────
// Called by the authenticated planner to generate/reuse an RSVP token and
// optionally send an invitation email to the guest.

export const generateRsvpLink = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { guestId, sendEmail } = data as { guestId: string; sendEmail: boolean };
  const userId = context.auth.uid;

  // Load the user's guest list
  const guestSnap = await db.collection('guests').doc(userId).get();
  const guestList: any[] = guestSnap.exists ? (guestSnap.data()?.guests ?? []) : [];
  const guest = guestList.find((g: any) => g.id === guestId);
  if (!guest) {
    throw new functions.https.HttpsError('not-found', 'Guest not found.');
  }

  // Reuse an existing valid token, or generate a fresh one
  let token: string = guest.rsvpToken ?? '';
  if (token) {
    const existing = await db.collection('rsvpTokens').doc(token).get();
    if (!existing.exists || existing.data()!.expiresAt <= Date.now()) {
      token = ''; // expired or missing — regenerate
    }
  }

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    const weddingSnap = await db.collection('weddings').doc(userId).get();
    const w = weddingSnap.data() ?? {};

    await db.collection('rsvpTokens').doc(token).set({
      userId,
      guestId,
      guestFirstName: guest.firstName ?? '',
      guestLastName:  guest.lastName  ?? '',
      weddingDate:        w.date             ?? '',
      ceremonyTime:       w.ceremonyTime     ?? '',
      churchAndAddress:   w.churchAndAddress ?? '',
      receptionVenue:     w.receptionVenue   ?? '',
      receptionStartTime: w.receptionStartTime ?? '',
      expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
    });
  }

  // Persist token (and sentAt if emailing) back to the guest record
  const now = Date.now();
  await db.collection('guests').doc(userId).set({
    guests: guestList.map((g: any) =>
      g.id === guestId
        ? { ...g, rsvpToken: token, ...(sendEmail ? { rsvpEmailSentAt: now } : {}) }
        : g
    ),
  });

  // Build the RSVP URL using app base URL from config (fallback to production URL)
  const baseUrl = (functions.config().app?.base_url ?? 'https://passion-planner-d4daf.web.app').replace(/\/$/, '');
  const rsvpUrl = `${baseUrl}/rsvp/${token}`;

  // Send the email if requested and the guest has an email address
  if (sendEmail && guest.email) {
    const guestName = [
      guest.firstName,
      guest.middleInitial ? guest.middleInitial.trim() + '.' : '',
      guest.lastName,
    ].filter(Boolean).join(' ');

    const weddingSnap = await db.collection('weddings').doc(userId).get();
    const wedding = weddingSnap.data() ?? {};

    await getTransporter().sendMail({
      from:    '"Passion Planner" <thepassionplanner2026@gmail.com>',
      to:      guest.email,
      subject: "You're Invited — Please RSVP",
      html:    buildRsvpEmailHtml({ guestName, rsvpUrl, wedding }),
    });
  }

  return { token, rsvpUrl };
});

// ── submitRsvp ────────────────────────────────────────────────────────────────
// Public callable (no auth required) — the guest submits their RSVP response.

export const submitRsvp = functions.https.onCall(async (data) => {
  const { token, status, meal } = data as {
    token: string;
    status: 'confirmed' | 'declined';
    meal?: string;
  };

  const tokenSnap = await db.collection('rsvpTokens').doc(token).get();
  if (!tokenSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Invalid RSVP link.');
  }

  const { userId, guestId, expiresAt, guestFirstName, guestLastName, weddingDate } = tokenSnap.data()!;
  if (Date.now() > expiresAt) {
    throw new functions.https.HttpsError('deadline-exceeded', 'This RSVP link has expired. Please contact the couple.');
  }

  const guestSnap = await db.collection('guests').doc(userId).get();
  const guestList: any[] = guestSnap.data()?.guests ?? [];

  await db.collection('guests').doc(userId).set({
    guests: guestList.map((g: any) =>
      g.id === guestId
        ? { ...g, rsvp: status, ...(meal ? { meal } : {}), rsvpRespondedAt: Date.now() }
        : g
    ),
  });

  return {
    success: true,
    guestName: [guestFirstName, guestLastName].filter(Boolean).join(' '),
    weddingDate,
  };
});

// ── Email HTML template ───────────────────────────────────────────────────────

function buildRsvpEmailHtml({ guestName, rsvpUrl, wedding }: {
  guestName: string;
  rsvpUrl:   string;
  wedding:   Record<string, any>;
}): string {
  const dateStr = wedding.date
    ? new Date(wedding.date + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const details = [
    dateStr                   && `📅 <strong style="color:#2F2F33;">${dateStr}</strong>`,
    wedding.ceremonyTime      && `⏰ Ceremony at <strong style="color:#2F2F33;">${wedding.ceremonyTime}</strong>`,
    wedding.churchAndAddress  && `⛪ <strong style="color:#2F2F33;">${wedding.churchAndAddress}</strong>`,
    wedding.receptionVenue    && `🥂 Reception at <strong style="color:#2F2F33;">${wedding.receptionVenue}</strong>`,
    wedding.receptionStartTime && `  &nbsp;&nbsp;starts at <strong style="color:#2F2F33;">${wedding.receptionStartTime}</strong>`,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FCF9F6;font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding:40px 16px;">
  <table width="560" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E8DDD3;max-width:100%;">

    <!-- Header -->
    <tr>
      <td style="background:#C97B84;padding:36px 40px;text-align:center;">
        <p style="margin:0 0 6px;color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:3px;text-transform:uppercase;">
          You're cordially invited
        </p>
        <h1 style="margin:0;color:#ffffff;font-size:30px;font-family:Georgia,'Times New Roman',serif;font-weight:bold;line-height:1.2;">
          Please RSVP
        </h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 14px;font-size:16px;color:#2F2F33;line-height:1.5;">
          Dear <strong>${guestName}</strong>,
        </p>
        <p style="margin:0 0 28px;font-size:14px;color:#6D6A70;line-height:1.7;">
          We are thrilled to invite you to celebrate with us on our special day.
          Please let us know if you'll be joining us — it would mean the world to have you there.
        </p>

        ${details.length ? `
        <table cellpadding="0" cellspacing="0" width="100%"
          style="background:#FCF9F6;border-radius:12px;border:1px solid #E8DDD3;margin-bottom:32px;">
          <tr><td style="padding:20px 24px;">
            ${details.map(d => `<p style="margin:0 0 8px;font-size:13px;color:#6D6A70;">${d}</p>`).join('')}
          </td></tr>
        </table>` : ''}

        <!-- CTA button -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
          <tr><td align="center">
            <a href="${rsvpUrl}"
              style="display:inline-block;padding:16px 48px;background:#C97B84;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
              Confirm my RSVP →
            </a>
          </td></tr>
        </table>

        <p style="margin:0;font-size:12px;color:#6D6A70;text-align:center;line-height:1.6;">
          Can't click? Copy this link into your browser:<br>
          <a href="${rsvpUrl}" style="color:#C97B84;word-break:break-all;font-size:11px;">${rsvpUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:18px 40px;background:#FCF9F6;border-top:1px solid #E8DDD3;text-align:center;">
        <p style="margin:0;font-size:11px;color:#6D6A70;">
          Powered by Passion Planner &nbsp;•&nbsp; Link valid for 90 days
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
