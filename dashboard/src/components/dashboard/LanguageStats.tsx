"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Code2 } from "lucide-react"
import { LanguageIcon, getLanguageIcon } from "@/lib/language-icons"

interface Language {
  name: string
  minutes: number
  percentage: number
}

interface LanguageStatsProps {
  languages: Language[]
  className?: string
}

export function LanguageStats({ languages, className }: LanguageStatsProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 1) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const totalTime = languages.reduce((sum, lang) => sum + lang.minutes, 0)
  
  const enhancedLanguages = languages.map((lang, index) => {
    const languageInfo = getLanguageIcon(lang.name)
    return {
      ...lang,
      displayName: languageInfo.displayName,
      rank: index + 1
    }
  })

  return (
    <Card className={`${className} border-0 `}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          Programming Languages
        </CardTitle>
        {languages.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Total coding time: {formatTime(totalTime)} across {languages.length} languages
          </div>
        )}
      </CardHeader>

      <CardContent>
        {enhancedLanguages.length > 0 ? (
          <div className="space-y-3">
            {enhancedLanguages.map((language) => (
              <div key={language.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <LanguageIcon language={language.name} size={16} />
                    <span className="font-medium text-sm truncate">
                      {language.displayName}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      #{language.rank}
                    </Badge>
                  </div>
                  <div className="text-right text-sm ml-3">
                    <div className="font-medium">{formatTime(language.minutes)}</div>
                    <div className="text-xs text-muted-foreground">
                      {language.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={language.percentage} className="h-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Code2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No language data available</p>
            <p className="text-xs opacity-75">Start coding to see your language breakdown</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
