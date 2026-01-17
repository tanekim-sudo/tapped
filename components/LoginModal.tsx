import React, { useState } from 'react';

interface LoginModalProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onSignIn, onSignUp, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await onSignUp(email, password, name);
      } else {
        await onSignIn(email, password);
      }
      // Don't call onClose here - let the parent handle it after setting user
      // This prevents the modal from closing before the async operations complete
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false); // Reset loading on error so user can try again
    }
    // Note: We don't set loading to false on success because onClose() will unmount the component
    // But if there's an error, we need to reset it so the user can retry
  };

  return (
    <div 
      className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-md p-8 md:p-12 brutal-card !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
            {isSignUp ? 'Join Tapped' : 'Sign In'}
          </h2>
          <button 
            onClick={onClose}
            className="text-4xl font-light hover:text-[#ff4d00] leading-none"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-brutal flex-1 !bg-black !text-white disabled:opacity-50"
            >
              {loading ? '...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setLoading(false); // Reset loading state when switching modes
            }}
            disabled={loading}
            className="text-[9px] font-bold text-[#ff4d00] uppercase hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
