import React from 'react';
import { Clock, MapPin, Plus, User, Users, FileText } from 'lucide-react';
import { ScheduledClass, WEEK_DAYS } from '../../types';
import { parseISODate } from '../../utils/dates';
import { STATUS_META, sortByTime, tint } from './ui';

interface WeekGridProps {
  dates: string[]; // 7 datas (segunda a domingo)
  sessions: ScheduledClass[];
  today: string;
  canEdit: boolean;
  onOpen: (s: ScheduledClass) => void;
  onCreate: (date: string) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ dates, sessions, today, canEdit, onOpen, onCreate }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
    {dates.map((date, i) => {
      const day = sortByTime(sessions.filter((s) => s.date === date));
      const isToday = date === today;
      const d = parseISODate(date);
      return (
        <div
          key={date}
          className={`rounded-2xl border flex flex-col min-h-[180px] ${
            isToday ? 'bg-[#FBF6F1] border-[#D0A68D] ring-1 ring-[#D0A68D]' : 'bg-white border-[#ECE5DE]'
          }`}
        >
          <div className={`px-3 py-2.5 border-b flex items-center justify-between ${isToday ? 'border-[#E8D3C3]' : 'border-[#ECE5DE]'}`}>
            <div>
              <p className="text-xs font-bold text-[#2C3228]">{WEEK_DAYS[i]}</p>
              <p className="text-[10px] text-[#8C827A]">
                {d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                {isToday && <span className="ml-1 font-bold text-[#D0A68D]">• Hoje</span>}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => onCreate(date)}
                className="p-1 rounded-lg text-[#8C827A] hover:bg-[#F4ECE6] hover:text-[#2C3228]"
                title="Nova aula neste dia"
                aria-label={`Nova aula em ${WEEK_DAYS[i]}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-2 space-y-2 flex-1">
            {day.length === 0 ? (
              canEdit ? (
                <button
                  onClick={() => onCreate(date)}
                  className="w-full h-full min-h-[100px] rounded-xl border border-dashed border-[#E2DAD1] text-[11px] text-[#8C827A] hover:bg-[#FBF9F6]"
                >
                  Sem aulas — adicionar
                </button>
              ) : (
                <p className="text-[11px] text-[#8C827A] text-center py-6">Sem aulas</p>
              )
            ) : (
              day.map((s) => {
                const cancelled = s.status === 'cancelada';
                const over = s.capacity > 0 && s.attendees.length > s.capacity;
                return (
                  <button
                    key={s.id}
                    onClick={() => onOpen(s)}
                    className={`w-full text-left p-2.5 rounded-xl border-l-4 border border-[#ECE5DE] hover:shadow-sm transition-all ${cancelled ? 'opacity-60' : ''}`}
                    style={{ borderLeftColor: s.color || '#2C3228', backgroundColor: tint(s.color) }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-[#2C3228] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D0A68D]" /> {s.startTime}–{s.endTime}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_META[s.status].cls}`}>
                        {STATUS_META[s.status].label}
                      </span>
                    </div>
                    <p className={`text-xs font-bold text-[#2C3228] mt-1 leading-tight ${cancelled ? 'line-through' : ''}`}>
                      {s.title}
                    </p>
                    <div className="mt-1 space-y-0.5 text-[10px] text-[#61574E]">
                      {s.instructorName && (
                        <p className="flex items-center gap-1 truncate"><User className="w-3 h-3 shrink-0" /> {s.instructorName}</p>
                      )}
                      {s.room && (
                        <p className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {s.room}</p>
                      )}
                      <p className={`flex items-center gap-1 ${over ? 'text-[#A04A42] font-bold' : ''}`}>
                        <Users className="w-3 h-3 shrink-0" /> {s.attendees.length}/{s.capacity}
                        {s.status === 'realizada' && <span className="ml-1">• {s.present.length} presentes</span>}
                        {s.lessonPlan?.trim() && <FileText className="w-3 h-3 ml-auto text-[#8C827A]" aria-label="Com plano de aula" />}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      );
    })}
  </div>
);
