import { useState, useEffect, useCallback } from 'react';
import { Ship, LogOut } from 'lucide-react';
import {
  supabase,
  ADMIN_USERNAME,
  PHOTO_BUCKET,
  BONUS_SPOT_BASE,
  MAX_BONUS_UPLOADS,
  type GrachtenUser,
  type GrachtenPhoto,
  type GrachtenPollAnswer,
  type GrachtenTextEntry,
  type DisabledItem,
  type DisabledSet,
  parseDisabledItems,
} from '@/lib/supabase';
import {
  TRIP_DESCRIPTION,
  PHOTO_SPOTS,
  THINGS_SPOTS,
  POLL_QUESTIONS,
} from '@/lib/data';
import PhotoSpot from '@/components/PhotoSpot';
import PollCard from '@/components/PollCard';
import BonusUpload from '@/components/BonusUpload';
import TextEntry from '@/components/TextEntry';
import ProgressBar from '@/components/ProgressBar';
import LeaderboardBar from '@/components/LeaderboardBar';
import AdminControls from '@/components/AdminControls';

type HomePageProps = {
  user: GrachtenUser;
  onSubmitResults: () => void;
  onLogout: () => void;
};

type PhotoUrls = Record<number, string>;
type PollAnswers = Record<number, { selected: number; correct: boolean }>;
type LeaderboardUser = Pick<GrachtenUser, 'id' | 'username' | 'total_score'>;

export default function HomePage({ user, onSubmitResults, onLogout }: HomePageProps) {
  const [photoUrls, setPhotoUrls] = useState<PhotoUrls>({});
  const [pollAnswers, setPollAnswers] = useState<PollAnswers>({});
  const [bonusCount, setBonusCount] = useState(0);
  const [textSaved, setTextSaved] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabledItems, setDisabledItems] = useState<DisabledSet>({ photoSpots: new Set(), pollQuestions: new Set() });
  const isAdmin = user.username === ADMIN_USERNAME;

  const computeScore = useCallback(
    (photos: PhotoUrls, polls: PollAnswers, bonus: number, saved: boolean, disabled: DisabledSet) => {
      const photoPoints = Object.keys(photos)
        .filter((k) => {
          const idx = parseInt(k);
          return idx < BONUS_SPOT_BASE && !disabled.photoSpots.has(idx);
        }).length;
      const pollPoints = Object.entries(polls)
        .filter(([k, p]) => p.correct && !disabled.pollQuestions.has(parseInt(k))).length;
      const bonusPoints = Math.min(bonus, MAX_BONUS_UPLOADS);
      const textPoint = saved ? 1 : 0;
      return photoPoints + pollPoints + bonusPoints + textPoint;
    },
    [],
  );

  useEffect(() => {
    loadExistingData();
    loadLeaderboard();
    loadDisabledItems();
  }, []);

  const loadDisabledItems = async () => {
    const { data, error } = await supabase.from('disabled_items').select('*');
    if (error) {
      console.error('Failed to load disabled items:', error);
      return;
    }
    setDisabledItems(parseDisabledItems((data || []) as DisabledItem[]));
  };

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from('grachten_users')
      .select('id, username, total_score')
      .order('total_score', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load leaderboard:', error);
      return;
    }

    setLeaderboard(
      ((data || []) as LeaderboardUser[]).filter((participant) => participant.username !== ADMIN_USERNAME),
    );
  };

  const loadExistingData = async () => {
    try {
      const [photosRes, pollsRes, textRes] = await Promise.all([
        supabase.from('grachten_photos').select('*').eq('user_id', user.id),
        supabase.from('grachten_poll_answers').select('*').eq('user_id', user.id),
        supabase.from('grachten_text_entries').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      const urls: PhotoUrls = {};
      let bonus = 0;
      if (photosRes.data) {
        for (const photo of photosRes.data as GrachtenPhoto[]) {
          const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(photo.storage_path);
          urls[photo.spot_index] = data.publicUrl + '?t=' + Date.now();
          if (photo.spot_index >= BONUS_SPOT_BASE) bonus++;
        }
      }

      const answers: PollAnswers = {};
      if (pollsRes.data) {
        for (const ans of pollsRes.data as GrachtenPollAnswer[]) {
          answers[ans.poll_index] = { selected: ans.selected_option, correct: ans.is_correct };
        }
      }

      const hasText = textRes.data !== null;
      setTextSaved(hasText);
      setPhotoUrls(urls);
      setPollAnswers(answers);
      setBonusCount(bonus);
      const s = computeScore(urls, answers, bonus, hasText, disabledItems);
      setScore(s);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (photos: PhotoUrls, polls: PollAnswers, bonus: number, saved: boolean) => {
    const s = computeScore(photos, polls, bonus, saved, disabledItems);
    setScore(s);
    const { error } = await supabase.from('grachten_users').update({ total_score: s }).eq('id', user.id);
    if (error) {
      console.error('Failed to update score:', error);
      return;
    }
    await loadLeaderboard();
  };

  const handleAdminChanged = async () => {
    const { data, error } = await supabase.from('disabled_items').select('*');
    if (error) {
      console.error('Failed to reload disabled items:', error);
      return;
    }
    const newDisabled = parseDisabledItems((data || []) as DisabledItem[]);
    setDisabledItems(newDisabled);
    const s = computeScore(photoUrls, pollAnswers, bonusCount, textSaved, newDisabled);
    setScore(s);
    const { error: updateError } = await supabase.from('grachten_users').update({ total_score: s }).eq('id', user.id);
    if (!updateError) await loadLeaderboard();
  };

  const handlePhotoUploaded = (spotIndex: number, url: string) => {
    const newPhotos = { ...photoUrls, [spotIndex]: url };
    setPhotoUrls(newPhotos);
    updateScore(newPhotos, pollAnswers, bonusCount, textSaved);
  };

  const handlePollAnswer = async (pollIndex: number, optionIndex: number) => {
    const poll = POLL_QUESTIONS[pollIndex];
    const isCorrect = optionIndex === poll.correctIndex;

    try {
      await supabase.from('grachten_poll_answers').upsert({
        user_id: user.id,
        poll_index: pollIndex,
        selected_option: optionIndex,
        is_correct: isCorrect,
      }, { onConflict: 'user_id,poll_index' });

      const newAnswers = { ...pollAnswers, [pollIndex]: { selected: optionIndex, correct: isCorrect } };
      setPollAnswers(newAnswers);
      updateScore(photoUrls, newAnswers, bonusCount, textSaved);
    } catch (err) {
      console.error('Failed to save poll answer:', err);
      alert('Antwort konnte nicht gespeichert werden. Bitte versuche es erneut.');
    }
  };

  const handleBonusUploaded = () => {
    const newBonus = bonusCount + 1;
    setBonusCount(newBonus);
    updateScore(photoUrls, pollAnswers, newBonus, textSaved);
  };

  const handleTextSaved = () => {
    setTextSaved(true);
    updateScore(photoUrls, pollAnswers, bonusCount, true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tan-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentRank = leaderboard.findIndex((participant) => participant.id === user.id);

  return (
    <div className="min-h-screen bg-tan-100 pb-32">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Ship className="w-6 h-6 text-green-600" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <AdminControls disabled={disabledItems} onChanged={handleAdminChanged} />
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              Abmelden
            </button>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-700 mb-6">
          Amsterdam Grachtenfahrt
        </h1>
      </div>

      {/* Canal route image */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div
          className="h-[260px] sm:h-[340px] overflow-hidden"
          style={{ borderRadius: '43% 57% 58% 42% / 31% 40% 60% 69%' }}
        >
          <img
            src="/Screenshot_2026-10-04_115058.png"
            alt="Beleuchtete Grachtenfahrt in Amsterdam"
            className="h-full w-full object-cover object-[50%_58%] scale-[1.08]"
          />
        </div>
      </div>

      {/* Trip description */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-tan-300 rounded-3xl p-6">
          <p className="text-white text-sm sm:text-base leading-relaxed">{TRIP_DESCRIPTION}</p>
        </div>
      </div>

      {/* Photo spots */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <h2 className="text-green-700 text-lg font-semibold mb-4">Fotografiere möglichst viele der folgenden Sehenswürdigkeiten!</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {PHOTO_SPOTS.map((spot, i) => (
            <PhotoSpot
              key={i}
              spotIndex={i}
              label={spot.label}
              detail={spot.detail}
              user={user}
              isAdmin={isAdmin}
              existingPhotoUrl={photoUrls[i] ?? null}
              onUploaded={(url) => handlePhotoUploaded(i, url)}
              disabled={disabledItems.photoSpots.has(i)}
            />
          ))}
        </div>
      </div>

      {/* Things spots */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <h2 className="text-green-700 text-lg font-semibold mb-4">Fotografiere möglichst viele der folgenden Dinge!</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {THINGS_SPOTS.map((spot, i) => {
            const spotIndex = PHOTO_SPOTS.length + i;
            return (
              <PhotoSpot
                key={spotIndex}
                spotIndex={spotIndex}
                showFunFact={false}
                label={spot.label}
                user={user}
                existingPhotoUrl={photoUrls[spotIndex] ?? null}
                onUploaded={(url) => handlePhotoUploaded(spotIndex, url)}
                disabled={disabledItems.photoSpots.has(spotIndex)}
              />
            );
          })}
        </div>
      </div>

      {/* Polls */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <h2 className="text-green-700 text-lg font-semibold mb-4">Grachten-Quiz</h2>
        <div className="flex flex-col gap-4">
          {POLL_QUESTIONS.map((poll, i) => (
            <PollCard
              key={i}
              pollIndex={i}
              poll={poll}
              selectedOption={pollAnswers[i]?.selected ?? null}
              isCorrect={pollAnswers[i]?.correct ?? null}
              onSelect={(opt) => handlePollAnswer(i, opt)}
              disabled={disabledItems.pollQuestions.has(i)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      {/* Bonus upload */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <h2 className="text-green-700 text-lg font-semibold mb-4">Bonus-Fotos</h2>
        <p className="text-green-600 text-sm mb-4">
          Lade bis zu {MAX_BONUS_UPLOADS} zusätzliche Fotos für Bonuspunkte hoch!
        </p>
        <BonusUpload
          user={user}
          uploadedCount={bonusCount}
          onUploaded={handleBonusUploaded}
        />
        {bonusCount > 0 && (
          <p className="text-green-600 text-xs mt-2 text-center">
            {bonusCount} von {MAX_BONUS_UPLOADS} hochgeladen
          </p>
        )}
      </div>

      {/* Text entry */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <TextEntry
          user={user}
          onSaved={handleTextSaved}
          initialText={null}
        />
      </div>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <ProgressBar score={score} />
      </div>

      {/* Submit button */}
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={onSubmitResults}
          className="w-full py-4 rounded-full bg-green-700 text-white font-semibold text-base hover:bg-green-800 transition-colors shadow-lg"
        >
          Abgeben und Ergebnisse sehen
        </button>
      </div>

      <LeaderboardBar
        score={score}
        rank={currentRank >= 0 ? currentRank + 1 : null}
        topUsers={leaderboard.slice(0, 3)}
      />
    </div>
  );
}
