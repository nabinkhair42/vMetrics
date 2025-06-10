'use client';

import { useAuthStore } from '@/store';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store the JWT token
      localStorage.setItem('auth_token', token);
      
      // Decode JWT to get user data and update Zustand store
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        useAuthStore.getState().setUser({
          id: payload.userId,
          username: payload.username,
          email: payload.email,
        });
      } catch (error) {
        console.error('Failed to decode JWT:', error);
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      // No token, redirect to login
      router.push('/');
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
