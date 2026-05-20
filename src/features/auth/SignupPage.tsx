import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../api/firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {verificationSent ? (
        <div className="p-4 bg-primary/10 text-primary rounded-md">
          <p className="text-sm mb-2">
            A verification email has been sent to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
          </p>
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="mt-2 w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground bg-background"
              
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground bg-background"
              
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
