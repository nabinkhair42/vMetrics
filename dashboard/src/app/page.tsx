'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, BarChart3, Clock, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            VSCode Productivity Tracker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Track your coding productivity and digital wellbeing across all your VSCode projects. 
            Get insights into your coding patterns and improve your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Activity className="h-12 w-12 mx-auto text-blue-600" />
              <CardTitle>Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically track your coding activity, file changes, and focus sessions 
                in real-time as you work in VSCode.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mx-auto text-green-600" />
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize your productivity with beautiful charts, project insights, 
                and programming language statistics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-12 w-12 mx-auto text-purple-600" />
              <CardTitle>Focus Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Understand your focus patterns, track idle time, and optimize 
                your coding sessions for better productivity.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Sign in with your GitHub account to start tracking your productivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={login} 
                className="w-full" 
                size="lg"
              >
                <Github className="h-5 w-5 mr-2" />
                Continue with GitHub
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                We only track productivity metrics, not your code content
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Install Extension</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Install our VSCode extension and sign in with GitHub
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-2 flex-shrink-0">
                <span className="text-green-600 dark:text-green-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Start Coding</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Code normally - we'll automatically track your activity in the background
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2 flex-shrink-0">
                <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">View Insights</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Check your dashboard for productivity insights and analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
