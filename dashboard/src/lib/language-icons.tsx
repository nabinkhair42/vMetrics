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
  // JavaScript/TypeScript
  typescript: { icon: SiTypescript, color: '#3178C6', displayName: 'TypeScript' },
  typescriptreact: { icon: SiTypescript, color: '#3178C6', displayName: 'TypeScript React' },
  javascript: { icon: SiJavascript, color: '#F7DF1E', displayName: 'JavaScript' },
  javascriptreact: { icon: SiJavascript, color: '#F7DF1E', displayName: 'JavaScript React' },

  // Web Technologies
  html: { icon: SiHtml5, color: '#E44D26', displayName: 'HTML' },
  css: { icon: SiCss3, color: '#1572B6', displayName: 'CSS' },
  scss: { icon: SiSass, color: '#CD6799', displayName: 'SCSS' },
  sass: { icon: SiSass, color: '#CD6799', displayName: 'Sass' },
  react: { icon: SiReact, color: '#61DAFB', displayName: 'React' },
  vue: { icon: SiVuedotjs, color: '#42B883', displayName: 'Vue' },
  angular: { icon: SiAngular, color: '#DD0031', displayName: 'Angular' },
  svelte: { icon: SiSvelte, color: '#FF3E00', displayName: 'Svelte' },

  // Backend Languages
  python: { icon: SiPython, color: '#3776AB', displayName: 'Python' },
  java: { icon: SiOpenjdk, color: '#007396', displayName: 'Java' },
  cpp: { icon: SiCplusplus, color: '#00599C', displayName: 'C++' },
  'c++': { icon: SiCplusplus, color: '#00599C', displayName: 'C++' },
  c: { icon: SiC, color: '#A8B9CC', displayName: 'C' },
  rust: { icon: SiRust, color: '#DEA584', displayName: 'Rust' },
  go: { icon: SiGo, color: '#00ADD8', displayName: 'Go' },
  golang: { icon: SiGo, color: '#00ADD8', displayName: 'Go' },
  php: { icon: SiPhp, color: '#8892BE', displayName: 'PHP' },
  ruby: { icon: SiRuby, color: '#701516', displayName: 'Ruby' },
  swift: { icon: SiSwift, color: '#FA7343', displayName: 'Swift' },
  kotlin: { icon: SiKotlin, color: '#7F52FF', displayName: 'Kotlin' },
  dart: { icon: SiDart, color: '#0175C2', displayName: 'Dart' },

  // Functional Languages
  elixir: { icon: SiElixir, color: '#6E4A7E', displayName: 'Elixir' },
  erlang: { icon: SiErlang, color: '#B83998', displayName: 'Erlang' },
  haskell: { icon: SiHaskell, color: '#5D4F85', displayName: 'Haskell' },
  scala: { icon: SiScala, color: '#DC322F', displayName: 'Scala' },
  clojure: { icon: SiClojure, color: '#5881D8', displayName: 'Clojure' },

  // Data / Config
  json: { icon: SiJson, color: '#292929', displayName: 'JSON' },
  markdown: { icon: SiMarkdown, color: '#FFFF00', displayName: 'Markdown' },
  md: { icon: SiMarkdown, color: '#000000', displayName: 'Markdown' },
  yaml: { icon: SiYaml, color: '#CB171E', displayName: 'YAML' },
  yml: { icon: SiYaml, color: '#CB171E', displayName: 'YAML' },
  toml: { icon: SiToml, color: '#9C4221', displayName: 'TOML' },
  xml: { icon: SiXml, color: '#0060AC', displayName: 'XML' },

  // Shell / Scripts
  shellscript: { icon: SiGnubash, color: '#89E051', displayName: 'Shell Script' },
  shell: { icon: SiShell, color: '#89E051', displayName: 'Shell' },
  bash: { icon: SiGnubash, color: '#89E051', displayName: 'Bash' },
  sh: { icon: SiGnubash, color: '#89E051', displayName: 'Shell' },

  // Fallbacks
  ignore: { icon: File, color: '#6E7681', displayName: 'Ignore File' },
  gitignore: { icon: File, color: '#6E7681', displayName: 'Git Ignore' },
  text: { icon: FileText, color: '#4B5563', displayName: 'Text File' },
  log: { icon: FileText, color: '#4B5563', displayName: 'Log File' },
  mdx: { icon: SiMarkdown, color: '#FFFF00', displayName: 'MDX' },
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
