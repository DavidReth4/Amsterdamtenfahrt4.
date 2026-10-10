import { useState } from 'react';
import { Settings, X, Eye, EyeOff, Camera, HelpCircle } from 'lucide-react';
import { supabase, type DisabledSet } from '@/lib/supabase';
import { PHOTO_SPOTS, THINGS_SPOTS, POLL_QUESTIONS } from '@/lib/data';

type AdminControlsProps = {
  disabled: DisabledSet;
  onChanged: () => void;
};

export default function AdminControls({ disabled, onChanged }: AdminControlsProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const togglePhotoSpot = async (index: number) => {
    setBusy(index);
    try {
      if (disabled.photoSpots.has(index)) {
        await supabase
          .from('disabled_items')
          .delete()
          .eq('item_type', 'photo_spot')
          .eq('item_index', index);
      } else {
        await supabase
          .from('disabled_items')
          .insert({ item_type: 'photo_spot', item_index: index });
      }
      onChanged();
    } catch (err) {
      console.error('Failed to toggle photo spot:', err);
    } finally {
      setBusy(null);
    }
  };

  const togglePollQuestion = async (index: number) => {
    setBusy(index + 1000);
    try {
      if (disabled.pollQuestions.has(index)) {
        await supabase
          .from('disabled_items')
          .delete()
          .eq('item_type', 'poll_question')
          .eq('item_index', index);
      } else {
        await supabase
          .from('disabled_items')
          .insert({ item_type: 'poll_question', item_index: index });
      }
      onChanged();
    } catch (err) {
      console.error('Failed to toggle poll question:', err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
      >
        <Settings className="w-4 h-4" strokeWidth={1.5} />
        Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-tan-100 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-700">Admin-Steuerung</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full bg-green-700 text-white hover:bg-green-800 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-green-600 text-sm mb-6">
              Deaktiviere Foto-Stops oder Quizfragen, um sie für alle auszugrauen. Punkte werden automatisch entfernt und bei erneuter Aktivierung wiederhergestellt.
            </p>

            {/* Photo spots */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                <h3 className="text-green-700 font-semibold">Foto-Stops</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PHOTO_SPOTS.map((spot, i) => {
                  const isDisabled = disabled.photoSpots.has(i);
                  const isBusy = busy === i;
                  return (
                    <button
                      key={i}
                      onClick={() => togglePhotoSpot(i)}
                      disabled={isBusy}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isDisabled
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <span className="truncate mr-2">{i + 1}. {spot.label}</span>
                      {isDisabled ? (
                        <EyeOff className="w-4 h-4 shrink-0 text-gray-500" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Things spots */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                <h3 className="text-green-700 font-semibold">Dinge-Fotos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {THINGS_SPOTS.map((spot, i) => {
                  const spotIndex = PHOTO_SPOTS.length + i;
                  const isDisabled = disabled.photoSpots.has(spotIndex);
                  const isBusy = busy === spotIndex;
                  return (
                    <button
                      key={spotIndex}
                      onClick={() => togglePhotoSpot(spotIndex)}
                      disabled={isBusy}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isDisabled
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <span className="truncate mr-2">{i + 1}. {spot.label}</span>
                      {isDisabled ? (
                        <EyeOff className="w-4 h-4 shrink-0 text-gray-500" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-4 h-4 shrink-0 text-green-100" strokeWidth={1.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Poll questions */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                <h3 className="text-green-700 font-semibold">Quizfragen</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {POLL_QUESTIONS.map((poll, i) => {
                  const isDisabled = disabled.pollQuestions.has(i);
                  const isBusy = busy === i + 1000;
                  return (
                    <button
                      key={i}
                      onClick={() => togglePollQuestion(i)}
                      disabled={isBusy}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isDisabled
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <span className="truncate mr-2 text-left">{i + 1}. {poll.question}</span>
                      {isDisabled ? (
                        <EyeOff className="w-4 h-4 shrink-0 text-gray-500" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
