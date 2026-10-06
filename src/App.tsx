import React, { useState, useEffect } from 'react';
import { Loader2, ShieldOff, LogOut } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CRMModule } from './components/CRMModule';
import { EvaluationsModule } from './components/EvaluationsModule';
import { FinancialModule } from './components/FinancialModule';
import { PlansModule } from './components/PlansModule';
import { HRModule } from './components/HRModule';
import { ClassesModule } from './components/ClassesModule';
import { AgendaModule } from './components/AgendaModule';
import { ReportsModule } from './components/ReportsModule';
import { EcosystemAI } from './components/EcosystemAI';
import { UserManagement } from './components/UserManagement';
import { LoginPage } from './components/auth/LoginPage';

import { useAuth } from './auth/AuthContext';
import { MODULE_IDS } from './auth/modules';
import { DataProvider, useData } from './data/DataContext';

import { Transaction, TabType } from './types';

// Modals
import { AddMemberModal } from './components/modals/AddMemberModal';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { MemberDetailsModal } from './components/modals/MemberDetailsModal';
import { ReceiptModal } from './components/modals/ReceiptModal';

const FullScreenMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[100dvh] bg-[#F4F2EE] text-[#2C3228] font-sans flex items-center justify-center p-6 antialiased">
    <div className="max-w-sm text-center flex flex-col items-center">{children}</div>
  </div>
);

export function App() {
  const { session, profile, loading, isPasswordRecovery, signOut } = useAuth();

  if (loading) {
    return (
      <FullScreenMessage>
        <Loader2 className="w-6 h-6 animate-spin text-[#8C827A]" />
      </FullScreenMessage>
    );
  }

  if (!session || isPasswordRecovery) {
    return <LoginPage key={isPasswordRecovery ? 'recovery' : 'login'} recovery={isPasswordRecovery} />;
  }

  const hasAnyAccess = profile?.active && (profile.is_admin || profile.permissions.length > 0);
  if (!hasAnyAccess) {
    return (
      <FullScreenMessage>
        <ShieldOff className="w-10 h-10 text-[#8C6353]" />
        <h1 className="font-serif text-xl font-bold mt-4">Sem acesso</h1>
        <p className="text-xs text-[#7A7067] mt-2">
          {!profile || !profile.active
            ? 'A sua conta está desativada ou não tem perfil associado.'
            : 'Ainda não lhe foram atribuídos módulos.'}{' '}
          Contacte a administração.
        </p>
        <button
          onClick={signOut}
          className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-[#303227] text-white rounded-xl text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" /> Terminar sessão
        </button>
      </FullScreenMessage>
    );
  }

  return (
    <DataProvider>
      <Workspace />
    </DataProvider>
  );
}

function Workspace() {
  const { profile, hasModule } = useAuth();
  const { error: dataError, reloadAll, members, transactions, employees, insights, actions } = useData();

  const allowedTabs: TabType[] = [
    ...MODULE_IDS.filter((m) => hasModule(m)),
    ...(profile?.is_admin ? (['users'] as TabType[]) : []),
  ];

  const [activeTab, setActiveTab] = useState<TabType>(allowedTabs[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Modais partilhados entre módulos
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [transactionDraft, setTransactionDraft] = useState<Partial<Transaction> | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Se as permissões mudarem e o separador atual deixar de ser permitido
  const allowedKey = allowedTabs.join(',');
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) setActiveTab(allowedTabs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKey]);

  const goToTab = (tab: TabType) => {
    if (allowedTabs.includes(tab)) setActiveTab(tab);
  };

  const openAddTransaction = (initial?: Partial<Transaction>) => setTransactionDraft(initial ?? {});

  return (
    <div className="min-h-[100dvh] bg-[#F4F2EE] text-[#2C3228] font-sans flex antialiased selection:bg-[#E8D5C8] selection:text-[#2C3228]">
      {/* Dark Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main Workspace Right Panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Search & Profile Bar */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onReloadData={reloadAll}
          onOpenAI={() => goToTab('ai')}
          onOpenMenu={() => setMenuOpen(true)}
        />

        {dataError && (
          <div className="mx-4 sm:mx-6 mt-2 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B]">
            {dataError}
          </div>
        )}

        {/* Dynamic Viewport */}
        <main className="flex-1 px-3 sm:px-6 pb-8">
          {activeTab === 'overview' && (
            <OverviewDashboard
              setActiveTab={goToTab}
              onOpenAddMember={() => setIsAddMemberOpen(true)}
              onOpenAddTransaction={() => openAddTransaction()}
            />
          )}

          {(activeTab === 'crm' || activeTab === 'marketing') && (
            <CRMModule
              key={activeTab}
              members={members}
              onUpdateMember={actions.saveMember}
              onOpenAddMember={() => setIsAddMemberOpen(true)}
              onSelectMember={(m) => setSelectedMemberId(m.id)}
            />
          )}

          {activeTab === 'evaluations' && <EvaluationsModule onSelectMember={(m) => setSelectedMemberId(m.id)} />}

          {activeTab === 'finance' && (
            <FinancialModule
              onOpenAddTransaction={openAddTransaction}
              onEditTransaction={(tx) => setTransactionDraft(tx)}
              onOpenReceipt={(tx) => setSelectedReceiptTx(tx)}
            />
          )}

          {activeTab === 'plans' && <PlansModule />}

          {activeTab === 'hr' && <HRModule />}

          {activeTab === 'classes' && <ClassesModule />}

          {activeTab === 'agenda' && <AgendaModule />}

          {activeTab === 'reports' && <ReportsModule />}

          {activeTab === 'ai' && <EcosystemAI members={members} transactions={transactions} employees={employees} insights={insights} />}

          {activeTab === 'users' && profile?.is_admin && <UserManagement onDataImported={reloadAll} />}
        </main>
      </div>

      {/* MODALS */}
      <AddMemberModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} onAddMember={actions.saveMember} />

      <AddTransactionModal
        isOpen={transactionDraft !== null}
        initial={transactionDraft}
        members={members}
        onAddTransaction={actions.saveTransaction}
        onClose={() => setTransactionDraft(null)}
      />

      <MemberDetailsModal member={members.find((m) => m.id === selectedMemberId) ?? null} onClose={() => setSelectedMemberId(null)} onUpdateMember={actions.saveMember} />

      <ReceiptModal transaction={selectedReceiptTx} onClose={() => setSelectedReceiptTx(null)} />
    </div>
  );
}

export default App;
