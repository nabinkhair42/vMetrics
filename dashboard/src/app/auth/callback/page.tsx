'use client';

import { UniversalLoading } from '@/components/UniversalLoading';
import { useAuthStore } from '@/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

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
   <UniversalLoading />
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<UniversalLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
