import { Loader } from "lucide-react"

export const UniversalLoading = () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Loader className="h-4 w-4 animate-spin mx-auto text-primary" />
      </div>
    )
  }