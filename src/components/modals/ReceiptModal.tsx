import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../../types';
import { formatKz } from '../../utils/formatters';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-[#E2DAD1] relative text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#2C3228] rounded-lg print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Area */}
        <div className="space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] p-1 flex items-center justify-center border border-[#E4DED8] shrink-0">
                <img src="/logo.png" alt="Ela Fit Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-[#2C3228]">
                  ELA FIT
                </h1>
                <p className="text-[10px] text-[#D0A68D] font-bold tracking-widest uppercase">
                  GINÁSIO FEMININO • AO SEU RITMO
                </p>
                <p className="text-[10px] text-[#8C827A] mt-0.5">
                  NIF: 541 881 223 • Talatona, Luanda, Angola
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-[#2C3228] text-white rounded-lg text-[10px] font-bold block">
                RECIBO OFICIAL
              </span>
              <p className="text-xs font-bold text-[#2C3228] mt-1">
                {transaction.receiptNumber || 'REC-2026-9042'}
              </p>
              <p className="text-[10px] text-[#8C827A]">Data: {transaction.date}</p>
            </div>
          </div>

          {/* Member Details */}
          <div className="p-4 bg-[#FBF9F6] border border-[#ECE5DE] rounded-xl space-y-1">
            <p className="text-[10px] text-[#8C827A] uppercase font-bold">Emitido a:</p>
            <p className="font-serif text-sm font-bold text-[#2C3228]">
              {transaction.memberName || 'Aluna Ela Fit'}
            </p>
            <p className="text-[#61574E]">Consumidora Final / Aluna Matriculada</p>
          </div>

          {/* Service Details Table */}
          <div className="border border-[#ECE5DE] rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-left min-w-[420px]">
              <thead className="bg-[#F4ECE6] text-[#2C3228] font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3">Descrição do Serviço</th>
                  <th className="p-3">Método</th>
                  <th className="p-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 font-semibold text-[#2C3228]">{transaction.description}</td>
                  <td className="p-3 text-[#61574E]">{transaction.paymentMethod}</td>
                  <td className="p-3 text-right font-bold text-[#166534] text-sm">
                    {formatKz(transaction.amount)}
                  </td>
                </tr>
              </tbody>
            </table></div>
          </div>

          {/* Legal / IVA Notice */}
          <div className="text-[10px] text-[#8C827A] space-y-1">
            <p>• Imposto sobre o Valor Acrescentado (IVA a 6% incluído nos serviços desportivos).</p>
            <p>• Documento comprovativo de liquidação de mensalidade / treino Ela Fit.</p>
          </div>

          {/* Signature Placeholder */}
          <div className="pt-6 border-t border-[#E8E2DC] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#166534] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pagamento Confirmado</span>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-[#2C3228] mb-1"></div>
              <p className="text-[10px] text-[#2C3228] font-bold">Marta Manuel</p>
              <p className="text-[8px] text-[#8C827A] uppercase">Administração • Ela Fit</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-[#ECE5DE] flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F4ECE6] text-[#2C3228] font-bold rounded-xl"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-[#2C3228] text-white font-bold rounded-xl hover:bg-[#3E4639] flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#D0A68D]" />
            <span>Imprimir Recibo (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
