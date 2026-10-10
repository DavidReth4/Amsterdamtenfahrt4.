import { useState, useEffect, useRef } from 'react';
import {
  supabase,
  ADMIN_USERNAME,
  type GrachtenUser,
  type CeremonyState,
} from '@/lib/supabase';
import UsernamePopup from '@/components/UsernamePopup';
import HomePage from '@/components/HomePage';
import ResultsPage from '@/components/ResultsPage';
import CeremonyPage from '@/components/CeremonyPage';

type Page = 'popup' | 'home' | 'results' | 'ceremony';

export default function App() {
  const [page, setPage] = useState<Page>('popup');
  const [user, setUser] = useState<GrachtenUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem('grachten_user_id');
    if (savedId) {
      supabase
        .from('grachten_users')
        .select('*')
        .eq('id', savedId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setUser(data as GrachtenUser);
            setPage('home');
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleUsernameComplete = async (username: string) => {
    try {
      const { data: existing } = await supabase
        .from('grachten_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        const existingUser = existing as GrachtenUser;
        localStorage.setItem('grachten_user_id', existingUser.id);
        setUser(existingUser);
        setPage('home');
        return;
      }

      const { data, error } = await supabase
        .from('grachten_users')
        .insert({ username })
        .select()
        .single();

      if (error) throw error;

      const newUser = data as GrachtenUser;
      localStorage.setItem('grachten_user_id', newUser.id);
      setUser(newUser);
      setPage('home');
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
      setPage('popup');
    }
  };

  const [ceremonyActive, setCeremonyActive] = useState(false);
  const prevCeremonyRef = useRef(false);

  useEffect(() => {
    const checkCeremony = async () => {
      const { data } = await supabase
        .from('ceremony_state')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      const state = data as CeremonyState | null;
      const active = state?.is_active === true;
      setCeremonyActive(active);
      if (!active && prevCeremonyRef.current) {
        setPage('results');
      }
      prevCeremonyRef.current = active;
    };

    checkCeremony();
    const interval = setInterval(checkCeremony, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-tan-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (page === 'popup' || !user) {
    return <UsernamePopup onComplete={handleUsernameComplete} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('grachten_user_id');
    setUser(null);
    setPage('popup');
  };

  if (ceremonyActive) {
    return <CeremonyPage currentUser={user} onCeremonyEnd={() => setCeremonyActive(false)} />;
  }

  if (page === 'results') {
    return <ResultsPage currentUser={user} onBack={() => setPage('home')} isAdmin={user.username === ADMIN_USERNAME} onLogout={handleLogout} />;
  }

  return <HomePage user={user} onSubmitResults={() => setPage('results')} onLogout={handleLogout} />;
}
