"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Code2, TrendingUp } from "lucide-react"

interface Language {
  name: string
  minutes: number
  percentage: number
  color: string
}

interface LanguageStatsProps {
  languages: Language[]
  className?: string
}

export function LanguageStats({ languages, className }: LanguageStatsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const totalTime = languages.reduce((sum, lang) => sum + lang.minutes, 0)
  const topLanguage = languages.length > 0 ? languages[0] : null

  return (
    <Card className={`${className} flex flex-col bg-card/50 border border-border`}>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Code2 className="h-4 w-4 sm:h-5 sm:w-5" />
          Programming Languages
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">Your coding activity breakdown by language</CardDescription>

        {/* Summary Stats */}
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">{formatTime(totalTime)}</span>
              </span>
            </div>
            {topLanguage && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Top: <span className="font-medium text-foreground">{topLanguage.name}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Languages: <span className="font-medium text-foreground">{languages.length}</span>
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        {languages.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {languages.map((language) => (
              <div key={language.name} className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: language.color }}
                    />
                    <span className="font-medium text-sm sm:text-base truncate">{language.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {formatTime(language.minutes)}
                    </span>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {language.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={language.percentage}
                  className="h-2 sm:h-2.5"
                  style={
                    {
                      "--progress-background": language.color,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <Code2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base font-medium mb-1">No language data available</p>
            <p className="text-xs sm:text-sm opacity-75">Start coding to see your language breakdown</p>
          </div>
        )}

        {/* Additional insights for larger screens */}
        {languages.length > 0 && (
          <div className="hidden sm:flex justify-between items-center mt-6 pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              Most Active: <span className="font-medium text-foreground">{topLanguage?.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Diversity: <span className="font-medium text-foreground">{languages.length} languages</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
