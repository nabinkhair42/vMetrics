'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Github, BarChart3, Target, Zap, Shield, Code2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = () => {
    window.location.href = api.getGitHubAuthUrl();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="text-xl font-bold">vMetrics</span>
          </div>
          <Button onClick={handleLogin} variant="outline">
            <Github className="mr-2 h-4 w-4" />
            Sign in with GitHub
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Understand Your
          <br />
          <span className="text-primary">Coding Habits</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Track your development activity, set goals, and gain insights into your
          productivity patterns. Like Digital Wellbeing, but for developers.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" onClick={handleLogin}>
            <Github className="mr-2 h-5 w-5" />
            Get Started Free
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Activity Insights</CardTitle>
              <CardDescription>
                Beautiful charts showing your coding patterns, language usage,
                and productivity trends over time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Goals & Streaks</CardTitle>
              <CardDescription>
                Set daily coding goals and maintain streaks to stay motivated.
                Unlock achievements as you progress.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Real-time Tracking</CardTitle>
              <CardDescription>
                Automatic, non-intrusive tracking that runs in the background.
                See your progress update in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Privacy First</CardTitle>
              <CardDescription>
                We only track metadata like file names and timestamps. Your code
                content is never captured or stored.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code2 className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Multi-IDE Support</CardTitle>
              <CardDescription>
                Works with VS Code, Cursor, Windsurf, and more. Sync your
                activity across all your development environments.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Advanced Analytics</CardTitle>
              <CardDescription>
                Discover your most productive hours, track focus time, and
                identify areas for improvement.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">Ready to boost your productivity?</h2>
          <p className="mt-4 text-muted-foreground">
            Join developers who track their coding habits with vMetrics.
          </p>
          <Button size="lg" className="mt-8" onClick={handleLogin}>
            <Github className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} vMetrics. Open source and privacy focused.
          </p>
        </div>
      </footer>
    </div>
  );
}
