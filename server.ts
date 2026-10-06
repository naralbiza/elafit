import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { MODULE_IDS, isModuleId, type ModuleId, type Profile } from "./src/auth/modules";

// .env.local tem prioridade sobre .env
dotenv.config({ path: [".env.local", ".env"], quiet: true });

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || path.extname(process.argv[1] || "") === ".cjs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CORS_ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

// Cliente com service role: ignora RLS. Usar só no servidor, nunca expor ao browser.
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

app.use(express.json());

// Only required if the frontend and Express API are deployed on different origins.
app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, '');
  if (!origin || !CORS_ALLOWED_ORIGINS.has(origin)) return next();

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------- Autenticação ----------

interface AuthedRequest extends Request {
  profile?: Profile;
}

// Valida o token Supabase enviado em "Authorization: Bearer <token>" e carrega o perfil
async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase não configurado no servidor (SUPABASE_SERVICE_ROLE_KEY)." });
  }
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Sessão em falta. Inicie sessão novamente." });

  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile || !profile.active) {
      return res.status(403).json({ error: "Conta sem acesso. Contacte a administração." });
    }

    req.profile = profile as Profile;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao validar sessão." });
  }
}

function requireModule(...modules: ModuleId[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const p = req.profile!;
    if (p.is_admin || modules.some((m) => p.permissions.includes(m))) return next();
    res.status(403).json({ error: "Não tem permissão para usar esta funcionalidade." });
  };
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.profile?.is_admin) return next();
  res.status(403).json({ error: "Apenas administradores podem gerir utilizadores." });
}

// Aceita apenas módulos conhecidos e remove duplicados
function sanitizePermissions(value: unknown): ModuleId[] | null {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter(isModuleId))];
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Ela Fit Gestor" });
});

// ---------- Gestão de utilizadores (apenas admin) ----------

// Lista utilizadores com a data do último acesso
app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  const { data: profiles, error } = await supabaseAdmin!
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });

  const { data: authData } = await supabaseAdmin!.auth.admin.listUsers({ perPage: 1000 });
  const lastSignIn = new Map((authData?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]));

  res.json({ users: profiles.map((p) => ({ ...p, last_sign_in_at: lastSignIn.get(p.id) ?? null })) });
});

// Cria um utilizador (já confirmado) com as permissões indicadas
app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const { email, password, full_name, job_title, is_admin } = req.body ?? {};
  const permissions = sanitizePermissions(req.body?.permissions) ?? [];

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Email inválido." });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
  }
  if (typeof full_name !== "string" || !full_name.trim()) {
    return res.status(400).json({ error: "O nome é obrigatório." });
  }

  const { data, error } = await supabaseAdmin!.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim(), job_title: String(job_title ?? "").trim() },
  });
  if (error || !data.user) {
    const msg = /already been registered|already exists/i.test(error?.message ?? "")
      ? "Já existe um utilizador com este email."
      : error?.message || "Erro ao criar utilizador.";
    return res.status(400).json({ error: msg });
  }

  // O perfil é criado pelo trigger on_auth_user_created; aqui definimos funções e permissões
  const admin = Boolean(is_admin);
  const { data: profile, error: profileError } = await supabaseAdmin!
    .from("profiles")
    .upsert({
      id: data.user.id,
      email: data.user.email,
      full_name: full_name.trim(),
      job_title: String(job_title ?? "").trim(),
      is_admin: admin,
      permissions: admin ? MODULE_IDS : permissions,
      active: true,
    })
    .select()
    .single();
  if (profileError) {
    await supabaseAdmin!.auth.admin.deleteUser(data.user.id);
    return res.status(500).json({ error: profileError.message });
  }

  res.status(201).json({ user: profile });
});

// Atualiza dados, funções, permissões, estado ou senha de um utilizador
app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const isSelf = id === req.profile!.id;
  const body = req.body ?? {};
  const update: Record<string, unknown> = {};

  // Um administrador não pode desativar, despromover nem mudar a senha de outro administrador
  if (!isSelf) {
    const { data: target } = await supabaseAdmin!.from("profiles").select("is_admin").eq("id", id).maybeSingle();
    if (!target) return res.status(404).json({ error: "Utilizador não encontrado." });
    if (target.is_admin) {
      if (body.is_admin === false || body.active === false || body.password !== undefined) {
        return res.status(403).json({
          error: "Não pode desativar, remover a função ou alterar a senha de outro administrador.",
        });
      }
      delete body.permissions;
    }
  }

  if (typeof body.full_name === "string") update.full_name = body.full_name.trim();
  if (typeof body.job_title === "string") update.job_title = body.job_title.trim();
  if (typeof body.is_admin === "boolean") {
    if (isSelf && !body.is_admin) {
      return res.status(400).json({ error: "Não pode remover a sua própria função de administrador." });
    }
    update.is_admin = body.is_admin;
  }
  if (body.permissions !== undefined) {
    const permissions = sanitizePermissions(body.permissions);
    if (!permissions) return res.status(400).json({ error: "Permissões inválidas." });
    update.permissions = permissions;
  }
  if (typeof body.active === "boolean") {
    if (isSelf && !body.active) {
      return res.status(400).json({ error: "Não pode desativar a sua própria conta." });
    }
    update.active = body.active;
  }
  if (update.is_admin === true) update.permissions = MODULE_IDS;

  // Alterações em auth.users: senha e bloqueio de login
  const authUpdate: Record<string, unknown> = {};
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }
    authUpdate.password = body.password;
  }
  if (typeof body.active === "boolean") {
    authUpdate.ban_duration = body.active ? "none" : "876000h";
  }
  if (typeof update.full_name === "string") {
    authUpdate.user_metadata = { full_name: update.full_name };
  }
  if (Object.keys(authUpdate).length) {
    const { error } = await supabaseAdmin!.auth.admin.updateUserById(id, authUpdate);
    if (error) return res.status(400).json({ error: error.message });
  }

  if (!Object.keys(update).length) {
    const { data } = await supabaseAdmin!.from("profiles").select("*").eq("id", id).single();
    return res.json({ user: data });
  }

  const { data, error } = await supabaseAdmin!.from("profiles").update(update).eq("id", id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data });
});

// Apaga definitivamente um utilizador (o perfil é removido em cascata)
app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  if (req.params.id === req.profile!.id) {
    return res.status(400).json({ error: "Não pode apagar a sua própria conta." });
  }
  const { data: target } = await supabaseAdmin!
    .from("profiles")
    .select("is_admin")
    .eq("id", req.params.id)
    .maybeSingle();
  if (target?.is_admin) {
    return res.status(403).json({ error: "Um administrador não pode apagar outro administrador." });
  }
  const { error } = await supabaseAdmin!.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// Gemini AI Business Intelligence Endpoint
app.post("/api/ai/insights", requireAuth, requireModule("ai"), async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY não configurada. Por favor adicione a chave nas definições.",
      });
    }

    const { prompt, contextType, data } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
Você é a "ElaFit AI", a consultora executiva de inteligência de negócios especializada no ginásio feminino "Ela Fit" (slogan: "Ao Seu Ritmo").
O seu tom é profissional, encorajador, estratégico, focado em alta fidelização de alunas, saúde financeira e gestão de equipa empática.
Responda sempre em Português de Portugal.
    `;

    const userContent = `
[Contexto da Consulta: ${contextType || "Geral"}]
Dados do Sistema Ela Fit:
${JSON.stringify(data || {}, null, 2)}

Pergunta/Instrução do Utilizador:
${prompt}
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { role: "user", parts: [{ text: systemInstruction + "\n\n" + userContent }] }
      ],
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na API Gemini:", error);
    res.status(500).json({ error: error.message || "Erro ao processar com Inteligência Artificial" });
  }
});

// AI Draft Message for Member Retention / CRM Lead
app.post("/api/ai/generate-message", requireAuth, requireModule("crm", "marketing"), async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "GEMINI_API_KEY não configurada." });
    }

    const { type, recipientName, details } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Escreva uma mensagem calorosa, profissional e elegante para o WhatsApp/SMS do ginásio feminino Ela Fit.
Tipo de mensagem: ${type} (Ex: Boas-vindas, Lembrete de Renovação, Recuperação de Aluna Ausente, Agradecimento de Aula Experimental).
Nome da Aluna/Lead: ${recipientName}.
Detalhes adicionais: ${JSON.stringify(details || {})}.
Regras: Mantém o tom amigável, feminino, focado na jornada "Ao Seu Ritmo". Máximo 3 a 4 frases, com emojis adequados. Inclua uma chamada para ação clara.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    res.json({ message: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao gerar mensagem" });
  }
});

// Serve frontend / Vite in dev or static files in production
async function setupViteOrStatic() {
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL) return; // na Vercel o Express corre como função serverless (api/index.js)

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ela Fit Gestor running on http://localhost:${PORT} (${IS_PRODUCTION ? "produção" : "desenvolvimento"})`);
    console.log(
      process.env.GEMINI_API_KEY
        ? `Gemini configurado (modelo: ${GEMINI_MODEL})`
        : "AVISO: GEMINI_API_KEY não definida em .env.local — as funções de IA não vão funcionar."
    );
    console.log(
      supabaseAdmin
        ? `Supabase configurado (${SUPABASE_URL})`
        : "AVISO: VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não definidas — login e gestão de utilizadores não vão funcionar."
    );
  });
}

if (!process.env.VERCEL) setupViteOrStatic();

export default app;
