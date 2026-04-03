"use client";
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// The hardcoded admin email — works as a guaranteed fallback even if Firestore rules block access.
const ADMIN_EMAIL = "adminaapnexa@gmail.com";

/**
 * useAdminGuard
 * 
 * Priority order for admin check:
 *   1. Firestore /roles/{uid} document with role = "admin"
 *   2. Email fallback — if Firestore is unavailable / rules block it, compare email directly
 * 
 * This makes /admin work immediately without needing Firestore rule changes.
 * The roles bootstrap (step 1) is attempted silently and permission errors are swallowed.
 */
export function useAdminGuard(router) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        setLoading(false);
        return;
      }

      // ─── Fast path: email fallback (works even without Firestore rules) ───
      const isKnownAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      try {
        // Try Firestore roles collection first
        const roleRef = doc(db, 'roles', user.uid);
        const roleDoc = await getDoc(roleRef);

        if (roleDoc.exists() && roleDoc.data().role === 'admin') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Bootstrap: auto-create the roles document on first admin login
        if (isKnownAdmin) {
          try {
            await setDoc(roleRef, {
              role: 'admin',
              email: user.email,
              grantedAt: new Date().toISOString(),
            });
          } catch {
            // Firestore rules may block write — email fallback still works below
          }
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Not admin — redirect away
        router.replace('/');
      } catch (err) {
        // Firestore permission error — use email fallback
        if (isKnownAdmin) {
          console.info('[useAdminGuard] Firestore unavailable, using email fallback for admin access.');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        console.error('[useAdminGuard] Access denied:', err.message);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return { isAdmin, loading };
}

/**
 * useAuthGuard - Ensures the user is authenticated.
 * Redirects to '/login' if not logged in.
 */
export function useAuthGuard(router) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  return { user, loading };
}

/**
 * useCurrentUser - Returns the current auth state (non-redirecting).
 */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}

