"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Logo } from "@/components/ui/logo"
import { useUser } from "@/store"
import { LogOut, MoreVertical } from "lucide-react"

interface DashboardHeaderProps {
  onLogout: () => void
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  const user = useUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 md:gap-3">
          <Logo width={28} height={28} className="shrink-0" />
          <div className="flex items-center gap-1">
            <h1 className="text-lg font-semibold tracking-tight">
              VMetrics
            </h1>
            <span className="hidden md:inline-block text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-muted">
              Beta
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
            
            {/* Placeholder for Avatar Button - You'll implement this later */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full bg-muted"
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
