import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
];

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    // Save profile to localStorage as fallback
    const profile = {
      display_name: displayName.trim(),
      avatar_url: selectedAvatar,
      onboarded: true,
    };
    localStorage.setItem('aavl_user_profile', JSON.stringify(profile));

    // Redirect to home dashboard
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-esperia-purple to-esperia-pink rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to AAVL!</h1>
          <p className="text-sm text-muted-foreground mt-1">Let's set up your profile to start collaborating</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Picker */}
          <div className="space-y-3 text-center">
            <label className="text-sm font-semibold text-foreground block">Select Avatar</label>
            <div className="flex justify-center gap-4">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                    selectedAvatar === url ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-border'
                  }`}
                >
                  <img src={url} alt="preset avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <User className="w-4 h-4 text-muted-foreground" />
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Mercer"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-xl shadow-md hover:shadow-lg"
          >
            Complete Onboarding
          </button>
        </form>
      </motion.div>
    </div>
  );
}
