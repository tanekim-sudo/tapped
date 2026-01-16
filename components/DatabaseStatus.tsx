import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

// Make DatabaseStatus safe - don't crash if there's an error

const DatabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'not-configured' | 'error'>('checking');
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!supabase) {
          setStatus('not-configured');
          return;
        }

        // Try to query users table
        const { data, error, count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (error) {
          // If table doesn't exist, it's not configured
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            setStatus('not-configured');
          } else {
            console.error('Database check error:', error);
            setStatus('error');
          }
          return;
        }

        setStatus('connected');
        setUserCount(count || 0);
      } catch (error: any) {
        console.error('Connection check failed:', error);
        // If it's a table not found error, show not-configured
        if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
          setStatus('not-configured');
        } else {
          setStatus('error');
        }
      }
    };

    // Add a small delay to prevent blocking initial render
    const timer = setTimeout(() => {
      checkConnection();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (status === 'checking') {
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 text-xs">
        Checking database connection...
      </div>
    );
  }

  if (status === 'not-configured') {
    return (
      <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
        <p className="font-bold text-yellow-800 mb-2">⚠️ Database Not Configured</p>
        <p className="text-sm text-yellow-700 mb-3">
          Your app is using localStorage (browser-only). Users can't see each other.
        </p>
        <a
          href="https://github.com/tanekim-sudo/tapped/blob/main/QUICK_DATABASE_SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-yellow-800 underline font-bold"
        >
          → Set up Supabase database (5 min guide)
        </a>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 bg-red-50 border-2 border-red-300 rounded">
        <p className="font-bold text-red-800 mb-2">❌ Database Connection Error</p>
        <p className="text-sm text-red-700 mb-2">
          Check your Supabase credentials and make sure the schema is set up.
        </p>
        <a
          href="https://github.com/tanekim-sudo/tapped/blob/main/DATABASE_SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-red-800 underline font-bold"
        >
          → Troubleshooting guide
        </a>
      </div>
    );
  }

  return (
    <div className="p-3 bg-green-50 border border-green-300 rounded text-xs">
      <p className="font-bold text-green-800">
        ✅ Database Connected
      </p>
      {userCount !== null && (
        <p className="text-green-700 mt-1">
          {userCount} user{userCount !== 1 ? 's' : ''} in database
        </p>
      )}
    </div>
  );
};

export default DatabaseStatus;
