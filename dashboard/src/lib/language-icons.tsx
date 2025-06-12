import { Code2, File, FileText } from 'lucide-react'
import type { IconType } from 'react-icons'
import {
  SiAngular,
  SiC,
  SiClojure,
  SiCplusplus,
  SiCss3,
  SiDart,
  SiElixir,
  SiErlang,
  SiGnubash,
  SiGo,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiKotlin,
  SiMarkdown,
  SiOpenjdk,
  SiPhp,
  SiPython,
  SiReact,
  SiRuby,
  SiRust,
  SiSass,
  SiScala,
  SiShell,
  SiSvelte,
  SiSwift,
  SiToml,
  SiTypescript,
  SiVuedotjs,
  SiXml,
  SiYaml
} from 'react-icons/si'

interface LanguageInfo {
  icon: IconType | typeof Code2
  color: string
  displayName: string
}

const languageMap: Record<string, LanguageInfo> = {
  // JavaScript/TypeScript - Muted blues
  typescript: { icon: SiTypescript, color: '#64748b', displayName: 'TypeScript' },
  typescriptreact: { icon: SiTypescript, color: '#64748b', displayName: 'TypeScript React' },
  javascript: { icon: SiJavascript, color: '#64748b', displayName: 'JavaScript' },
  javascriptreact: { icon: SiJavascript, color: '#64748b', displayName: 'JavaScript React' },
  
  // Web Technologies - Muted grays
  html: { icon: SiHtml5, color: '#6b7280', displayName: 'HTML' },
  css: { icon: SiCss3, color: '#6b7280', displayName: 'CSS' },
  scss: { icon: SiSass, color: '#6b7280', displayName: 'SCSS' },
  sass: { icon: SiSass, color: '#6b7280', displayName: 'Sass' },
  react: { icon: SiReact, color: '#64748b', displayName: 'React' },
  vue: { icon: SiVuedotjs, color: '#64748b', displayName: 'Vue' },
  angular: { icon: SiAngular, color: '#64748b', displayName: 'Angular' },
  svelte: { icon: SiSvelte, color: '#64748b', displayName: 'Svelte' },
  
  // Backend Languages - Consistent muted tones
  python: { icon: SiPython, color: '#64748b', displayName: 'Python' },
  java: { icon: SiOpenjdk, color: '#64748b', displayName: 'Java' },
  cpp: { icon: SiCplusplus, color: '#64748b', displayName: 'C++' },
  'c++': { icon: SiCplusplus, color: '#64748b', displayName: 'C++' },
  c: { icon: SiC, color: '#64748b', displayName: 'C' },
  rust: { icon: SiRust, color: '#64748b', displayName: 'Rust' },
  go: { icon: SiGo, color: '#64748b', displayName: 'Go' },
  golang: { icon: SiGo, color: '#64748b', displayName: 'Go' },
  php: { icon: SiPhp, color: '#64748b', displayName: 'PHP' },
  ruby: { icon: SiRuby, color: '#64748b', displayName: 'Ruby' },
  swift: { icon: SiSwift, color: '#64748b', displayName: 'Swift' },
  kotlin: { icon: SiKotlin, color: '#64748b', displayName: 'Kotlin' },
  dart: { icon: SiDart, color: '#64748b', displayName: 'Dart' },
  
  // All other languages use consistent muted colors
  elixir: { icon: SiElixir, color: '#64748b', displayName: 'Elixir' },
  erlang: { icon: SiErlang, color: '#64748b', displayName: 'Erlang' },
  haskell: { icon: SiHaskell, color: '#64748b', displayName: 'Haskell' },
  scala: { icon: SiScala, color: '#64748b', displayName: 'Scala' },
  clojure: { icon: SiClojure, color: '#64748b', displayName: 'Clojure' },
  
  // Data/Config Files
  json: { icon: SiJson, color: '#6b7280', displayName: 'JSON' },
  markdown: { icon: SiMarkdown, color: '#6b7280', displayName: 'Markdown' },
  md: { icon: SiMarkdown, color: '#6b7280', displayName: 'Markdown' },
  yaml: { icon: SiYaml, color: '#6b7280', displayName: 'YAML' },
  yml: { icon: SiYaml, color: '#6b7280', displayName: 'YAML' },
  toml: { icon: SiToml, color: '#6b7280', displayName: 'TOML' },
  xml: { icon: SiXml, color: '#6b7280', displayName: 'XML' },
  
  // Shell/Scripts
  shellscript: { icon: SiGnubash, color: '#6b7280', displayName: 'Shell Script' },
  shell: { icon: SiShell, color: '#6b7280', displayName: 'Shell' },
  bash: { icon: SiGnubash, color: '#6b7280', displayName: 'Bash' },
  sh: { icon: SiGnubash, color: '#6b7280', displayName: 'Shell' },
  
  // Generic fallbacks
  ignore: { icon: File, color: '#9ca3af', displayName: 'Ignore File' },
  gitignore: { icon: File, color: '#9ca3af', displayName: 'Git Ignore' },
  text: { icon: FileText, color: '#9ca3af', displayName: 'Text File' },
  log: { icon: FileText, color: '#9ca3af', displayName: 'Log File' },
}

export function getLanguageIcon(language: string): LanguageInfo {
  const normalizedLanguage = language.toLowerCase().trim()
  
  if (languageMap[normalizedLanguage]) {
    return languageMap[normalizedLanguage]
  }
  
  // Enhanced fallback handling
  for (const [key, info] of Object.entries(languageMap)) {
    if (normalizedLanguage.includes(key) || key.includes(normalizedLanguage)) {
      return info
    }
  }
  
  const displayName = language
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  return {
    icon: Code2,
    color: '#9ca3af',
    displayName
  }
}

export function LanguageIcon({ 
  language, 
  size = 16, 
  className = "" 
}: { 
  language: string
  size?: number
  className?: string 
}) {
  const { icon: Icon } = getLanguageIcon(language)
  
  return (
    <Icon 
      size={size} 
      className={`${className} text-muted-foreground`}
    />
  )
}

export { languageMap }
