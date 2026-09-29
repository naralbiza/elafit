# Ela Fit — Gestor de Negócio

Sistema de gestão para o ginásio feminino Ela Fit: CRM de alunas, financeiro, RH, aulas e assistente de IA (Gemini).
Login, utilizadores e dados ficam no **Supabase**.

## Executar localmente

**Pré-requisito:** Node.js 20 ou superior e um projeto no [Supabase](https://supabase.com).

1. Instalar dependências:
   `npm install`
2. **Criar as tabelas no Supabase:** Dashboard → SQL Editor → New query → colar o conteúdo de
   [supabase/schema.sql](supabase/schema.sql) → Run.
3. **Desativar o registo público:** Dashboard → Authentication → Sign In / Providers →
   desligar "Allow new users to sign up". As contas passam a ser criadas só pelo administrador.
4. Preencher [.env.local](.env.local) com as chaves (Dashboard → Project Settings → API) e a chave Gemini.
5. **Criar o primeiro administrador:** Dashboard → Authentication → Users → Add user → Create new user
   (marque "Auto Confirm User"). **O primeiro utilizador criado torna-se automaticamente administrador.**
6. Iniciar em modo desenvolvimento:
   `npm run dev` → abre em http://localhost:3001
7. Entrar com o administrador → menu **Utilizadores** → "Importar dados demo" (opcional) e criar a equipa.

## Utilizadores e permissões

- **Administrador:** acesso a todos os módulos e ao menu *Utilizadores* (criar, editar, redefinir senha, desativar e apagar contas).
- **Restantes utilizadores:** o administrador escolhe a que módulos cada pessoa tem acesso
  (Gestor de Negócio, CRM, Financeiro, RH, Aulas, Avaliações, Planos, Marketing, Relatórios, Configurações & IA).
  O menu só mostra os módulos permitidos.
- As permissões são aplicadas também na base de dados (Row Level Security), não só na interface.
  Por exemplo, os salários (tabela `employees`) só são visíveis para quem tem RH ou IA.
- Contas desativadas ficam bloqueadas no login.

## Produção

```
npm run build
npm start
```

## Variáveis de ambiente

| Variável                    | Obrigatória | Descrição                                                        |
| --------------------------- | ----------- | ---------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Sim         | URL do projeto Supabase                                          |
| `VITE_SUPABASE_ANON_KEY`    | Sim         | Chave pública `anon` (usada no browser)                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim         | Chave `service_role` — só no servidor, para gerir utilizadores   |
| `GEMINI_API_KEY`            | Sim         | Chave da API Gemini (usada só no servidor)                       |
| `GEMINI_MODEL`              | Não         | Modelo Gemini (padrão `gemini-2.5-flash`)                        |
| `PORT`                      | Não         | Porta do servidor (padrão `3001`)                                |

As chaves `service_role` e Gemini nunca são enviadas ao navegador. O frontend chama `/api/admin/*` e `/api/ai/*`
com o token da sessão, e o servidor Express ([server.ts](server.ts)) valida o utilizador e as permissões.

> Nota: as variáveis `VITE_*` são embutidas no build do frontend. Depois de as alterar, reinicie o `npm run dev` ou volte a correr `npm run build`.
