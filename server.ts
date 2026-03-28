import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    google_id TEXT UNIQUE,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "";
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "";
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireSupabaseAdmin = (res: any) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase admin is not configured on the server." });
    return false;
  }
  return true;
};

const requireFirebaseConfig = (res: any) => {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    res.status(500).json({ error: "Firebase server credentials are missing." });
    return false;
  }
  return true;
};

const authenticateSupabaseAdmin = async (req: any, res: any, next: any) => {
  if (!requireSupabaseAdmin(res)) return;

  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const accessToken = match?.[1];

  if (!accessToken) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin!.auth.getUser(accessToken);

  if (authError || !user) {
    return res.status(401).json({ error: "Invalid Supabase session." });
  }

  const { data: profile, error: profileError } = await supabaseAdmin!
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  if (!profile || profile.role !== "admin") {
    // Failover for specific admin emails if DB check fails
    const isAdminEmail = user.email === 'kurdishphelps@gmail.com' || user.email === 'phelpskurdish@gmail.com';
    if (!isAdminEmail) {
      return res.status(403).json({ error: "Admin access required." });
    }
  }


  req.supabaseUser = user;
  next();
};

const getFirebaseAccessToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: FIREBASE_CLIENT_EMAIL,
      sub: FIREBASE_CLIENT_EMAIL,
      aud: "https://oauth2.googleapis.com/token",
      scope: FCM_SCOPE,
      iat: now,
      exp: now + 3600,
    },
    FIREBASE_PRIVATE_KEY,
    { algorithm: "RS256" }
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firebase token request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token as string;
};

const sendFirebaseMessage = async (
  accessToken: string,
  targetToken: string,
  payload: {
    notificationId: string;
    title: string;
    body: string;
    type: string;
    sendAt: string;
  }
) => {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: targetToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            notification_id: payload.notificationId,
            type: payload.type,
            send_at: payload.sendAt,
          },
          android: {
            priority: "HIGH",
            notification: {
              channel_id: "fcm_fallback_notification_channel",
            },
          },
        },
      }),
    }
  );

  if (response.ok) {
    const data = await response.json();
    return { ok: true, data };
  }

  const errorBody = await response.text();
  return { ok: false, errorBody };
};

app.get("/api/push/diagnostics", authenticateSupabaseAdmin, async (req, res) => {
  if (!requireSupabaseAdmin(res)) return;

  try {
    const { data: profiles, error } = await supabaseAdmin!
      .from("profiles")
      .select("id, email, display_name, fcm_token, role")
      .not("fcm_token", "is", null);

    if (error) throw error;

    res.json({
      total_with_tokens: profiles?.length || 0,
      recipients: (profiles || []).map(p => ({
        id: p.id,
        name: p.display_name,
        email: p.email,
        token_preview: p.fcm_token ? `${p.fcm_token.substring(0, 10)}...` : 'null',
        role: p.role
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Auth Routes ---

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
    const result = stmt.run(email, hashedPassword, name || email.split('@')[0]);
    
    const token = jwt.sign({ id: result.lastInsertRowid, email, name }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ user: { id: result.lastInsertRowid, email, name } });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.get("/api/auth/me", authenticate, (req: any, res) => {
  const user: any = db.prepare("SELECT id, email, name, avatar FROM users WHERE id = ?").get(req.user.id);
  res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { secure: true, sameSite: 'none' });
  res.json({ success: true });
});

app.post("/api/push/broadcasts/:id/send", authenticateSupabaseAdmin, async (req: any, res) => {
  if (!requireSupabaseAdmin(res) || !requireFirebaseConfig(res)) return;

  try {
    const broadcastId = req.params.id;
    console.log(`FCM: Starting broadcast send process for ID: ${broadcastId}`);

    const { data: broadcast, error: broadcastError } = await supabaseAdmin!
      .from("broadcast_notifications")
      .select("*")
      .eq("id", broadcastId)
      .maybeSingle();

    if (broadcastError) {
      console.error(`FCM: Broadcast fetch error: ${broadcastError.message}`);
      return res.status(500).json({ error: broadcastError.message });
    }

    if (!broadcast) {
      console.warn(`FCM: Broadcast ID ${broadcastId} not found`);
      return res.status(404).json({ error: "Broadcast not found." });
    }

    console.log(`FCM: Broadcast metadata: ${broadcast.title_en || broadcast.title_ar}`);

    const { data: preferences, error: preferencesError } = await supabaseAdmin!
      .from("user_notification_preferences")
      .select("user_id, allow_broadcast, preferred_language");

    if (preferencesError && preferencesError.code !== "42P01") {
      return res.status(500).json({ error: preferencesError.message });
    }

    const optedOutUsers = new Set(
      (preferences || [])
        .filter((row: any) => row.allow_broadcast === false)
        .map((row: any) => row.user_id)
    );

    const languageByUser = new Map<string, "app" | "en" | "ar">(
      (preferences || []).map((row: any) => [row.user_id, row.preferred_language || "app"])
    );

    const { data: profiles, error: profilesError } = await supabaseAdmin!
      .from("profiles")
      .select("id, fcm_token")
      .not("fcm_token", "is", null);

    if (profilesError) {
      return res.status(500).json({ error: profilesError.message });
    }

    const recipients = (profiles || []).filter(
      (row: any) => row.fcm_token && !optedOutUsers.has(row.id)
    );

    console.log(`FCM: Found ${recipients.length} total potential recipients with tokens.`);

    if (!recipients.length) {
      console.warn("FCM: No recipients found with fcm_token. Check if users are logged in on the app.");
      return res.json({
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
        message: "No eligible device tokens found.",
      });
    }

    const accessToken = await getFirebaseAccessToken();
    console.log("FCM: Firebase access token acquired.");
    let sent = 0;
    let failed = 0;
    let lastError = "";
    const invalidUserIds: string[] = [];
    const deliveredUserIds: string[] = [];

    for (const recipient of recipients) {
      const preferredLanguage = languageByUser.get(recipient.id) || "app";

      const useArabic =
        preferredLanguage === "ar" ||
        (preferredLanguage === "app" && !broadcast.title_en && !!broadcast.title_ar);

      const title =
        useArabic
          ? broadcast.title_ar || broadcast.title_en || "Islamic Light"
          : broadcast.title_en || broadcast.title_ar || "Islamic Light";
      const body =
        useArabic
          ? broadcast.body_ar || broadcast.body_en || "Open the app to read more."
          : broadcast.body_en || broadcast.body_ar || "Open the app to read more.";

      const result = await sendFirebaseMessage(accessToken, recipient.fcm_token, {
        notificationId: broadcast.id,
        title,
        body,
        type: broadcast.type,
        sendAt: broadcast.send_at,
      });

      if (result.ok) {
        sent += 1;
        deliveredUserIds.push(recipient.id);
      } else {
        failed += 1;
        lastError = result.errorBody;
        console.error(`FCM: Failed to send to ${recipient.id}. Error: ${result.errorBody}`);
        if (
          result.errorBody.includes("UNREGISTERED") ||
          result.errorBody.includes("registration-token-not-registered") ||
          result.errorBody.includes("Requested entity was not found")
        ) {
          invalidUserIds.push(recipient.id);
        }
      }
    }

    console.log(`FCM: Batch complete. Sent: ${sent}, Failed: ${failed}`);

    if (invalidUserIds.length) {
      console.log(`FCM: Clearing ${invalidUserIds.length} invalid tokens.`);
      await supabaseAdmin!.from("profiles").update({ fcm_token: null }).in("id", invalidUserIds);
    }

    const successfulRecipients = recipients
      .filter((row: any) => deliveredUserIds.includes(row.id))
      .map((row: any) => ({
        notification_id: broadcast.id,
        user_id: row.id,
        status: "scheduled",
        delivered_at: new Date().toISOString(),
      }));

    if (successfulRecipients.length) {
      const { error: deliveryError } = await supabaseAdmin!
        .from("broadcast_notification_deliveries")
        .upsert(successfulRecipients, { onConflict: "notification_id,user_id" });
      if (deliveryError && deliveryError.code !== "42P01") {
        console.error("Broadcast delivery tracking failed:", deliveryError.message);
      }
    }

    res.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      invalidTokensCleared: invalidUserIds.length,
    });
  } catch (error: any) {
    console.error("Broadcast send failed:", error);
    res.status(500).json({ error: error.message || "Push send failed." });
  }
});

// --- Google OAuth Routes ---

app.get("/api/auth/google/url", (req, res) => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `${process.env.APP_URL}/auth/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  res.json({ url: `${rootUrl}?${qs.toString()}` });
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("No code provided");

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${process.env.APP_URL}/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    const { access_token, id_token } = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
      headers: { Authorization: `Bearer ${id_token}` },
    });

    const googleUser = await userResponse.json();

    // Upsert user
    let user: any = db.prepare("SELECT * FROM users WHERE google_id = ? OR email = ?").get(googleUser.id, googleUser.email);

    if (!user) {
      const stmt = db.prepare("INSERT INTO users (email, name, google_id, avatar) VALUES (?, ?, ?, ?)");
      const result = stmt.run(googleUser.email, googleUser.name, googleUser.id, googleUser.picture);
      user = { id: result.lastInsertRowid, email: googleUser.email, name: googleUser.name };
    } else if (!user.google_id) {
      db.prepare("UPDATE users SET google_id = ?, avatar = ? WHERE id = ?").run(googleUser.id, googleUser.picture, user.id);
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).send("Authentication failed");
  }
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
