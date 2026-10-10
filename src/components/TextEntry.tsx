import { useState, useEffect } from 'react';
import { supabase, type GrachtenUser } from '@/lib/supabase';

type TextEntryProps = {
  user: GrachtenUser;
  onSaved: () => void;
  initialText: string | null;
};

export default function TextEntry({ user, onSaved, initialText }: TextEntryProps) {
  const [text, setText] = useState(initialText ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initialText !== null);

  useEffect(() => {
    if (initialText !== null) {
      setText(initialText);
      setSaved(true);
    }
  }, [initialText]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await supabase
        .from('grachten_text_entries')
        .upsert({
          user_id: user.id,
          content: text.trim(),
        }, { onConflict: 'user_id' });

      setSaved(true);
      onSaved();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Speichern fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-green-600 rounded-2xl p-5">
      <p className="text-white text-sm mb-3">
        Schreibe, was immer du möchtest, über deine Grachtenfahrt-Erfahrung!
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="Teile deine Gedanken..."
        rows={4}
        className="w-full bg-green-800 text-white placeholder-white/40 rounded-xl px-4 py-3 outline-none border-2 border-transparent focus:border-green-400 resize-none text-sm"
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="px-5 py-2 rounded-full bg-green-800 text-white text-sm font-medium hover:bg-green-900 transition-colors disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        {saved && <span className="text-white/70 text-xs">Gespeichert!</span>}
      </div>
    </div>
  );
}
