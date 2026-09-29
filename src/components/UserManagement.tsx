import React, { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Search,
  Database,
  CheckCircle2,
  Power,
} from 'lucide-react';
import { apiFetch } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { APP_MODULES, MODULE_IDS, ModuleId, Profile } from '../auth/modules';
import { importDemoData } from '../data/repository';

type ManagedUser = Profile & { last_sign_in_at: string | null };

interface UserForm {
  full_name: string;
  email: string;
  job_title: string;
  password: string;
  is_admin: boolean;
  active: boolean;
  permissions: ModuleId[];
}

const emptyForm: UserForm = {
  full_name: '',
  email: '',
  job_title: '',
  password: '',
  is_admin: false,
  active: true,
  permissions: [],
};

async function readJson(res: Response) {
  if (res.status === 204) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

function formatDate(value: string | null) {
  if (!value) return 'Nunca';
  return new Date(value).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

interface UserManagementProps {
  onDataImported: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onDataImported }) => {
  const { profile: me, refreshProfile } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState<ManagedUser | 'new' | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readJson(await apiFetch('/api/admin/users'));
      setUsers(data.users);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openNew = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (u: ManagedUser) => {
    setForm({
      full_name: u.full_name,
      email: u.email,
      job_title: u.job_title,
      password: '',
      is_admin: u.is_admin,
      active: u.active,
      permissions: u.permissions,
    });
    setFormError(null);
    setEditing(u);
  };

  const togglePermission = (id: ModuleId) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id) ? f.permissions.filter((p) => p !== id) : [...f.permissions, id],
    }));
  };

  // Outro administrador: só nome e cargo podem ser alterados
  const editingOtherAdmin = editing !== null && editing !== 'new' && editing.is_admin && editing.id !== me?.id;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editing === 'new') {
        await readJson(
          await apiFetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({
              full_name: form.full_name,
              email: form.email,
              job_title: form.job_title,
              password: form.password,
              is_admin: form.is_admin,
              permissions: form.permissions,
            }),
          })
        );
        setNotice(`Utilizador ${form.full_name} criado com sucesso.`);
      } else if (editing) {
        await readJson(
          await apiFetch(`/api/admin/users/${editing.id}`, {
            method: 'PATCH',
            body: JSON.stringify(
              editingOtherAdmin
                ? { full_name: form.full_name, job_title: form.job_title }
                : {
                    full_name: form.full_name,
                    job_title: form.job_title,
                    is_admin: form.is_admin,
                    active: form.active,
                    permissions: form.permissions,
                    ...(form.password ? { password: form.password } : {}),
                  }
            ),
          })
        );
        setNotice(`Utilizador ${form.full_name} atualizado.`);
        if (editing.id === me?.id) await refreshProfile();
      }
      setEditing(null);
      await loadUsers();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: ManagedUser) => {
    setError(null);
    try {
      await readJson(
        await apiFetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ active: !u.active }) })
      );
      setNotice(`${u.full_name} ${u.active ? 'desativada' : 'reativada'}.`);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!window.confirm(`Apagar definitivamente o utilizador ${u.full_name} (${u.email})?`)) return;
    setError(null);
    try {
      await readJson(await apiFetch(`/api/admin/users/${u.id}`, { method: 'DELETE' }));
      setNotice(`Utilizador ${u.full_name} apagado.`);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleImportDemo = async () => {
    if (!window.confirm('Importar os dados de demonstração para o Supabase? Registos com o mesmo ID serão substituídos.')) return;
    setImporting(true);
    setError(null);
    try {
      await importDemoData();
      setNotice('Dados de demonstração importados.');
      onDataImported();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const filtered = users.filter((u) =>
    `${u.full_name} ${u.email} ${u.job_title}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pt-2">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#303227]">Utilizadores e Permissões</h2>
          <p className="text-xs text-[#7A7067] mt-1">
            Crie contas para a equipa e defina a que módulos cada pessoa tem acesso.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImportDemo}
            disabled={importing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#EFECE8] border border-[#E4DED8] text-[#303227] rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Importar dados demo
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#303227] hover:bg-[#414336] text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Novo utilizador
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-xs text-[#166534]">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {notice}</span>
          <button onClick={() => setNotice(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#EFECE8]">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9A9187]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar utilizador..."
              className="w-full pl-9 pr-3 py-2 bg-[#F4F2EE] border border-[#E4DED8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#303227]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#8C827A]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF7F2] text-[#7A7067] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Utilizador</th>
                  <th className="px-4 py-3 font-semibold">Função</th>
                  <th className="px-4 py-3 font-semibold">Acessos</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Último acesso</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE8]">
                {filtered.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id} className={u.active ? '' : 'opacity-60'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#E8D5C8] text-[#303227] font-bold flex items-center justify-center text-[11px] shrink-0">
                            {u.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2C3228]">
                              {u.full_name} {isMe && <span className="text-[10px] text-[#8C827A] font-normal">(você)</span>}
                            </p>
                            <p className="text-[11px] text-[#8C827A]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {u.is_admin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#303227] text-white text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </span>
                          ) : null}
                          <span className="text-[#5E574F]">{u.job_title || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="text-[#8C827A]">Todos os módulos</span>
                        ) : u.permissions.length ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {APP_MODULES.filter((m) => u.permissions.includes(m.id)).map((m) => (
                              <span key={m.id} className="px-1.5 py-0.5 rounded-md bg-[#F4ECE6] text-[#8C6353] text-[10px]">
                                {m.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#D3453B]">Sem acessos</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.active ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#991B1B]'
                          }`}
                        >
                          {u.active ? 'Ativa' : 'Desativada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#8C827A]">{formatDate(u.last_sign_in_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-[#EFECE8] text-[#5E574F]" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!isMe && !u.is_admin && (
                            <>
                              <button
                                onClick={() => handleToggleActive(u)}
                                className="p-1.5 rounded-lg hover:bg-[#EFECE8] text-[#5E574F]"
                                title={u.active ? 'Desativar' : 'Reativar'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg hover:bg-[#FEE2E2] text-[#D3453B]" title="Apagar">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#8C827A]">Nenhum utilizador encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal criar / editar */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] border border-[#E2DDD7] rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-xl font-bold text-[#303227]">
                {editing === 'new' ? 'Novo utilizador' : 'Editar utilizador'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-[#EAE4DC] text-[#7A7067]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome completo" className="col-span-2">
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Email" className="col-span-2">
                <input
                  required
                  type="email"
                  disabled={editing !== 'new'}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`${inputCls} disabled:opacity-60`}
                />
              </Field>
              <Field label="Cargo / Função">
                <input
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  placeholder="Ex: Rececionista"
                  className={inputCls}
                />
              </Field>
              <Field label={editing === 'new' ? 'Senha inicial' : 'Nova senha (opcional)'}>
                <input
                  type="password"
                  disabled={editingOtherAdmin}
                  required={editing === 'new'}
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mín. 6 caracteres"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Administrador */}
            <label className="mt-4 flex items-start gap-3 p-3 rounded-xl border border-[#E4DED8] bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_admin}
                disabled={(editing !== 'new' && editing.id === me?.id) || editingOtherAdmin}
                onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                className="mt-0.5 accent-[#303227]"
              />
              <div>
                <p className="text-xs font-semibold text-[#2C3228] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Administrador
                </p>
                <p className="text-[11px] text-[#8C827A]">Acesso a todos os módulos e à gestão de utilizadores.</p>
              </div>
            </label>

            {/* Permissões por módulo */}
            {!form.is_admin && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-[#5E574F]">Módulos com acesso</p>
                  <div className="flex gap-2 text-[11px]">
                    <button type="button" className="text-[#8C6353] hover:underline" onClick={() => setForm({ ...form, permissions: [...MODULE_IDS] })}>
                      Todos
                    </button>
                    <button type="button" className="text-[#8C6353] hover:underline" onClick={() => setForm({ ...form, permissions: [] })}>
                      Nenhum
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {APP_MODULES.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        form.permissions.includes(m.id) ? 'border-[#303227] bg-white' : 'border-[#E4DED8] bg-[#F4F2EE]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(m.id)}
                        onChange={() => togglePermission(m.id)}
                        className="accent-[#303227]"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {editingOtherAdmin && (
              <p className="mt-4 text-[11px] text-[#8C6353] bg-[#F4ECE6] p-3 rounded-xl">
                Esta conta é de outro administrador: só pode alterar o nome e o cargo. Não é possível apagá-la,
                desativá-la, remover a função de administrador nem mudar a senha.
              </p>
            )}

            {editing !== 'new' && editing.id !== me?.id && !editing.is_admin && (
              <label className="mt-4 flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[#303227]" />
                Conta ativa (desmarque para bloquear o login)
              </label>
            )}

            {formError && (
              <div className="mt-4 flex gap-2 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B]">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5E574F] hover:bg-[#EFECE8]">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#303227] hover:bg-[#414336] disabled:opacity-60 text-white rounded-xl text-xs font-semibold"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing === 'new' ? 'Criar utilizador' : 'Guardar alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const inputCls =
  'w-full px-3 py-2 bg-white border border-[#E4DED8] rounded-xl text-xs text-[#2C3228] focus:outline-none focus:ring-1 focus:ring-[#303227]';

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => (
  <div className={className}>
    <label className="block text-[11px] font-semibold text-[#5E574F] mb-1">{label}</label>
    {children}
  </div>
);
