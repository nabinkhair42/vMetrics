"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LanguageIcon, getLanguageIcon } from "@/lib/language-icons"
import type { LanguageChartData } from "@/lib/types"
import { Code2 } from "lucide-react"
import type { CSSProperties } from "react"

interface LanguageStatsProps {
  languages: LanguageChartData[]
  className?: string
}

// Custom type for our progress bar style properties
interface CustomProgressStyle extends CSSProperties {
  '--indicator-color': string;
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
      color: languageInfo.color,
      rank: index + 1
    }
  })

  return (
    <Card className={`${className} border border-border/50 bg-card/50 backdrop-blur-sm`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          Programming Languages
        </CardTitle>
        {languages.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Total coding time: <span className="font-medium text-foreground">{formatTime(totalTime)}</span> across <span className="font-medium text-foreground">{languages.length}</span> languages
          </div>
        )}
      </CardHeader>

      <CardContent>
        {enhancedLanguages.length > 0 ? (
          <ScrollArea className="space-y-4 h-96">
            {enhancedLanguages.map((language) => (
              <div key={language.name} className="space-y-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <LanguageIcon 
                        language={language.name} 
                        size={18} 
                        className={`text-[${language.color}]`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm truncate block">
                        {language.displayName}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                      #{language.rank}
                    </Badge>
                  </div>
                  <div className="text-right text-sm ml-3 flex-shrink-0">
                    <div className="font-semibold">{formatTime(language.minutes)}</div>
                    <div className="text-xs text-muted-foreground">
                      {language.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{language.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={language.percentage} 
                    className="h-2"
                    indicatorClassName="transition-all duration-200"
                    style={{
                      background: `color-mix(in oklch, ${language.color}, transparent 85%)`,
                      '--indicator-color': language.color
                    } as CustomProgressStyle}
                  />
                </div>
              </div>
            ))}
          </ScrollArea>
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
