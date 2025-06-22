import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/ui/logo'
import { VscGithubInverted } from 'react-icons/vsc'

const LoginCard = () => {
    const {login} = useAuth()
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
    <Card className="w-96 border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center justify-center gap-2 mb-2">
          <Logo width={32} height={32} />
          <CardTitle className="text-xl">Authentication Required</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">Please login to view your productivity dashboard</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          onClick={() => login()}
          className="w-full bg-primary hover:bg-primary/90"
        >
            <VscGithubInverted className="h-4 w-4" />
         Login With GitHub
        </Button>
      </CardContent>
    </Card>
  </div>
  )
}

export default LoginCard