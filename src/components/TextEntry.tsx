import { useState, useEffect } from 'react';
import { supabase, type GrachtenUser } from '@/lib/supabase';

const QUESTIONS = [
  'Was hast du heute neues gelernt?',
  'Welche Fragen sind noch offen, bzw. haben sich neu ergeben?',
  'Hat dir die Grachtenfahrt - Rallye gefallen, wenn ja warum, wenn nein, warum nicht?',
  'Hat dir die Grachtenfahrt, unabhängig von der Rallye gefallen, wenn ja warum, wenn nein, warum nicht?',
];

type TextEntryProps = {
  user: GrachtenUser;
  onSaved: (answeredCount: number) => void;
  initialAnswers: (string | null)[] | null;
};

export default function TextEntry({ user, onSaved, initialAnswers }: TextEntryProps) {
  const [answers, setAnswers] = useState<string[]>(initialAnswers ? initialAnswers.map((a) => a ?? '') : ['', '', '', '']);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const isAdminBlocked = user.username === 'admin2026';

  useEffect(() => {
    if (initialAnswers) {
      setAnswers(initialAnswers.map((a) => a ?? ''));
      const count = initialAnswers.filter((a) => a && a.trim()).length;
      setSavedCount(count);
    }
  }, [initialAnswers]);

  const answeredCount = answers.filter((a) => a.trim()).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        content: answers.filter((a) => a.trim()).join('\n\n---\n\n'),
        answer_q1: answers[0].trim() || null,
        answer_q2: answers[1].trim() || null,
        answer_q3: answers[2].trim() || null,
        answer_q4: answers[3].trim() || null,
      };

      await supabase
        .from('grachten_text_entries')
        .upsert(payload, { onConflict: 'user_id' });

      const count = answers.filter((a) => a.trim()).length;
      setSavedCount(count);
      onSaved(count);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Speichern fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-green-600 rounded-2xl p-5">
      <p className="text-white text-sm mb-1">
        Beantworte die folgenden Fragen — jede beantwortete Frage gibt einen Punkt!
      </p>
      <p className="text-white/60 text-xs mb-4">
        {answeredCount} von 4 Fragen beantwortet
      </p>
      <div className="flex flex-col gap-4">
        {QUESTIONS.map((q, i) => (
          <div key={i}>
            <p className="text-white text-xs font-medium mb-2">
              {i + 1}. {q}
            </p>
            <textarea
              value={answers[i]}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
                setSavedCount(null);
              }}
              placeholder="Deine Antwort..."
              rows={3}
              disabled={isAdminBlocked}
              className="w-full bg-green-800 text-white placeholder-white/40 rounded-xl px-4 py-3 outline-none border-2 border-transparent focus:border-green-400 resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving || answeredCount === 0 || isAdminBlocked}
          className="px-5 py-2 rounded-full bg-green-800 text-white text-sm font-medium hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        {savedCount !== null && savedCount > 0 && (
          <span className="text-white/70 text-xs">
            Gespeichert! ({savedCount} {savedCount === 1 ? 'Punkt' : 'Punkte'})
          </span>
        )}
      </div>
    </div>
  );
}
