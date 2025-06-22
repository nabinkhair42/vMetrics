import { Activity, BarChart2, Clock, Github, Layout, Shield } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Smart Time Tracking",
    description: "Automatically detects coding sessions, idle time, and active files. Tracks your focus periods with customizable idle detection."
  },
  {
    icon: BarChart2,
    title: "Detailed Analytics",
    description: "Interactive charts showing daily patterns, project time allocation, and GitHub-style activity heatmaps. Track your most productive hours."
  },
  {
    icon: Layout,
    title: "Beautiful Dashboard",
    description: "Modern web dashboard with real-time stats, project breakdowns, and language usage. View your coding metrics in stunning visualizations."
  },
  {
    icon: Github,
    title: "Seamless Sync",
    description: "Single GitHub login syncs your activity across all devices. Your coding stats stay unified whether you're at work or home."
  },
  {
    icon: Activity,
    title: "Focus Insights",
    description: "Track continuous coding sessions, breaks, and work patterns. Understand your peak productivity times and improve work-life balance."
  },
  {
    icon: Shield,
    title: "Privacy Focused",
    description: "Only tracks activity metadata, never your code. Your projects and intellectual property stay completely private and secure."
  }
];

export function Features() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      
      <div className="container px-4 mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary/90 via-primary to-primary/90 bg-clip-text text-transparent">
            Powerful Features for Developers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your coding habits, improve productivity, and gain insights into your development workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-8 rounded-2xl border bg-card/50 backdrop-blur-sm cursor-pointer overflow-hidden"
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Card content */}
              <div className="relative">
                {/* Icon container with gradient background */}
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center mb-5 ring-1 ring-primary/20">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>

                {/* Title with gradient on hover */}
                <h3 className="text-xl font-semibold mb-3 text-foreground/90 group-hover:text-primary transition-colors duration-200">
                  {feature.title}
                </h3>

                {/* Description with better contrast */}
                <p className="text-muted-foreground/90 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Subtle border gradient */}
              <div className="absolute inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 