import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configure Gmail transporter using env vars
let emailTransporter;
let transporterType = 'unknown';
console.log(`[EMAIL] GMAIL_USER = "${process.env.GMAIL_USER || '(not set)'}"`);
console.log(`[EMAIL] GMAIL_APP_PASSWORD = ${process.env.GMAIL_APP_PASSWORD ? '"****" (set, length=' + process.env.GMAIL_APP_PASSWORD.length + ')' : '(not set)'}`);

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
  transporterType = 'gmail';
  // Verify SMTP connection on startup
  emailTransporter.verify().then(() => {
    console.log('[EMAIL] ✅ Gmail SMTP connection verified successfully');
  }).catch((err) => {
    console.error('[EMAIL] ❌ Gmail SMTP verification FAILED:', err.message);
  });
} else {
  // Fallback transport that logs email to console (no real sending)
  emailTransporter = nodemailer.createTransport({ jsonTransport: true });
  transporterType = 'jsonTransport (NO REAL EMAILS SENT)';
}
console.log(`[EMAIL] Transporter type: ${transporterType}`);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK
let firebaseAdmin = null;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    }),
    databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`
  });
  firebaseAdmin = admin;
  console.log('Firebase Admin SDK initialized successfully.');
} else {
  console.warn('Firebase Admin SDK credentials not found. Some features will be unavailable.');
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', firebaseConfigured: !!firebaseAdmin });
});

// Slack Slash Command Endpoint: /taskflow create [task name]
app.post('/api/slack/taskflow', async (req, res) => {
  const { command, text, user_name } = req.body;
  console.log(`Received Slack command ${command} with text: "${text}" from user ${user_name}`);

  if (!firebaseAdmin) {
    return res.status(200).json({
      text: '⚠️ AAVL Slack Bot: Firebase is not configured on the server. Cannot create task.'
    });
  }

  try {
    const db = firebaseAdmin.database();

    // 1. Get all boards and find the most recently created one
    const boardsSnapshot = await db.ref('boards').orderByChild('created_at').limitToLast(1).once('value');

    if (!boardsSnapshot.exists()) {
      return res.status(200).json({
        text: '⚠️ AAVL Slack Bot: No boards found to add the task to.'
      });
    }

    let targetBoard = null;
    boardsSnapshot.forEach((childSnapshot) => {
      targetBoard = { id: childSnapshot.key, ...childSnapshot.val() };
    });

    if (!targetBoard) {
      return res.status(200).json({
        text: '⚠️ AAVL Slack Bot: No boards found to add the task to.'
      });
    }

    const boardData = targetBoard.data;

    // 2. Add card to the first list
    if (!boardData.lists || boardData.lists.length === 0) {
      return res.status(200).json({
        text: '⚠️ AAVL Slack Bot: Target board does not contain any lists.'
      });
    }

    const firstList = boardData.lists[0];
    const newCard = {
      id: `slack-card-${Date.now()}`,
      title: text || 'New Slack Task',
      description: `Created via Slack Slash command by @${user_name}`,
      labels: [],
      assignees: [],
      createdAt: new Date().toISOString()
    };

    firstList.cards = [...(firstList.cards || []), newCard];
    boardData.lists[0] = firstList;

    // 3. Update board in Firebase RTDB
    await db.ref(`boards/${targetBoard.id}/data`).set(boardData);

    return res.status(200).json({
      response_type: 'in_channel',
      text: `✅ Task *"${newCard.title}"* successfully created on board *${targetBoard.id.substring(0, 8)}* in the *${firstList.title}* column!`
    });
  } catch (err) {
    console.error('Error handling Slack command:', err);
    return res.status(200).json({
      text: `❌ Error creating task: ${err.message}`
    });
  }
});

// AI Claude Copilot Endpoint
app.post('/api/ai/copilot', async (req, res) => {
  const { prompt } = req.body;
  console.log(`Received AI Copilot prompt: "${prompt}"`);

  // Simulating Anthropic Claude API response structure
  // If CLAUDE_API_KEY is configured in the future, actual API calls can go here.
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    let tasks = [];
    if (prompt.toLowerCase().includes('marketing') || prompt.toLowerCase().includes('campaign')) {
      tasks = [
        'Research target market demographics',
        'Set up email marketing newsletter templates',
        'Draft launch announcement social copy',
        'Analyze competitors pricing and positioning',
        'Configure tracking pixels and conversion goals'
      ];
    } else if (prompt.toLowerCase().includes('website') || prompt.toLowerCase().includes('landing')) {
      tasks = [
        'Draft website copy and content outline',
        'Design high-fidelity desktop & mobile layouts',
        'Develop responsive frontend codebase',
        'Optimize page speed and image compression',
        'Publish site to production hosting'
      ];
    } else {
      tasks = [
        `Draft objectives for: ${prompt}`,
        'Define key success metrics',
        'Assign task owner and stakeholders',
        'Establish timeline and key milestones',
        'Schedule follow-up review meeting'
      ];
    }

    res.json({
      success: true,
      tasks,
      message: `Generated ${tasks.length} tasks matching your requirements.`
    });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to invite members
app.post('/api/boards/invite', async (req, res) => {
  const { email, boardId, role } = req.body;

  // Determine client base URL dynamically from request headers
  let clientOrigin = 'http://localhost:5173';
  if (req.headers.origin) {
    clientOrigin = req.headers.origin;
  } else if (req.headers.referer) {
    try {
      const parsedReferer = new URL(req.headers.referer);
      clientOrigin = parsedReferer.origin;
    } catch (e) {}
  }

  // Try to create/invite user via Firebase if configured
  if (firebaseAdmin) {
    try {
      // Check if user exists
      let userRecord;
      try {
        userRecord = await firebaseAdmin.auth().getUserByEmail(email);
        console.log(`User ${email} already exists with uid: ${userRecord.uid}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          userRecord = await firebaseAdmin.auth().createUser({
            email,
            emailVerified: false,
          });
          console.log(`Created new user for ${email} with uid: ${userRecord.uid}`);
        } else {
          throw err;
        }
      }

      const signInLink = await firebaseAdmin.auth().generateSignInWithEmailLink(email, {
        url: `${clientOrigin}/boards/${boardId}`,
        handleCodeInApp: true,
      });

      // Send email with link and role information
      await emailTransporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: `Invitation to board ${boardId}`,
        text: `You have been invited as a ${role} to board ${boardId}. Use this link to sign in: ${signInLink}`,
      });

      console.log(`Invitation email sent to ${email}`);
      res.json({
        success: true,
        message: `Invitation sent to ${email} with role ${role}.`,
        signInLink,
        role,
      });
    } catch (err) {
      console.error('Error inviting user:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    // Firebase not configured – still send email using the link placeholder
    const placeholderLink = `${clientOrigin}/boards/${boardId}`;
    try {
      console.log(`[EMAIL] Sending invite to ${email} via ${transporterType}...`);
      const info = await emailTransporter.sendMail({
        from: process.env.GMAIL_USER || 'noreply@aavl.com',
        to: email,
        subject: `You've been invited to collaborate on AAVL Board`,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px">
          <h2 style="color:#6d28d9">🎯 AAVL Board Invitation</h2>
          <p>You have been invited as a <strong>${role}</strong> to a board.</p>
          <a href="${placeholderLink}" style="display:inline-block;margin-top:12px;padding:10px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Open Board</a>
          <p style="margin-top:16px;font-size:12px;color:#888">Or copy this link: ${placeholderLink}</p>
        </div>`,
        text: `You have been invited as a ${role} to board ${boardId}. Use this link: ${placeholderLink}`,
      });
      console.log(`[EMAIL] sendMail result:`, JSON.stringify(info, null, 2));
      console.log(`Invitation email (fallback) sent to ${email}`);
      res.json({
        success: true,
        message: `Invitation sent to ${email} with role ${role} (Firebase not configured).`,
        signInLink: placeholderLink,
        role,
      });
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      res.status(500).json({ error: emailErr.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`AAVL Integration Server listening on port ${PORT}`);
});
