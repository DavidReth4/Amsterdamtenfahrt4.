import { useState } from 'react';
import { Ship } from 'lucide-react';

type UsernamePopupProps = {
  onComplete: (username: string) => void;
};

export default function UsernamePopup({ onComplete }: UsernamePopupProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError('Der Benutzername muss mindestens 2 Zeichen lang sein');
      return;
    }
    if (trimmed.length > 20) {
      setError('Der Benutzername darf höchstens 20 Zeichen lang sein');
      return;
    }
    setSubmitting(true);
    setTimeout(() => onComplete(trimmed), 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tan-100/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-green-700 rounded-full p-8 sm:p-12 shadow-2xl animate-pop-in"
        style={{ width: 'min(90vw, 420px)', minHeight: 'min(80vh, 420px)' }}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Ship className="w-12 h-12 text-tan-100 mb-4" strokeWidth={1.5} />
          <h2 className="text-tan-100 text-xl font-semibold mb-2">Willkommen!</h2>
          <p className="text-tan-100/70 text-sm mb-6">Wähle einen Benutzernamen, um die Grachtenfahrt zu beginnen</p>
          <form onSubmit={handleSubmit} className="w-full">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Dein Benutzername..."
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 rounded-full bg-green-800 text-tan-100 placeholder-tan-100/40 text-center outline-none border-2 border-transparent focus:border-green-400 transition-colors"
            />
            {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 px-4 py-3 rounded-full bg-tan-100 text-green-700 font-semibold hover:bg-white transition-colors disabled:opacity-50"
            >
              {submitting ? 'Lege ab...' : 'Reise starten'}
            </button>
          </form>
          {submitting && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-tan-100 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-tan-100 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-tan-100 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
