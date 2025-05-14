import { useState, useEffect } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

export default function GoogleSignIn() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      // You can access user info from result.user
      console.log('Signed in user:', result.user);
    } catch (error) {
      setError(error.message);
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('Signed out successfully');
    } catch (error) {
      setError(error.message);
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="auth-container">
      {error && <p className="error-message">{error}</p>}
      
      {user ? (
        <div className="user-info">
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="profile-picture"
            style={{ width: '50px', height: '50px', borderRadius: '50%' }}
          />
          <p>Welcome, {user.displayName}!</p>
          <button onClick={handleSignOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      ) : (
        <button onClick={signInWithGoogle} className="google-sign-in-button">
          Sign in with Google
        </button>
      )}
    </div>
  );
} 