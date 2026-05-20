import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../api/firebase';

export default function Navbar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const profileStr = localStorage.getItem('aavl_user_profile');
  const profile = profileStr ? JSON.parse(profileStr) : null;

  return (
    <nav className="h-14 border-b bg-primary flex items-center px-4 justify-between text-primary-foreground shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          AAVL
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-primary-foreground/80 transition-colors">Workspaces</Link>
          <Link to="/" className="hover:text-primary-foreground/80 transition-colors">Recent</Link>
          <Link to="/" className="hover:text-primary-foreground/80 transition-colors">Starred</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {profile ? (
          <>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-primary-foreground">{profile.display_name}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary-foreground/30">
                <img src={profile.avatar_url} alt="profile avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm font-medium hover:text-primary-foreground/80 transition-colors flex items-center gap-2 border-l border-primary-foreground/20 pl-4"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth/login" className="text-sm font-medium bg-primary-foreground text-primary px-4 py-1.5 rounded-md hover:bg-primary-foreground/90 transition-colors">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
