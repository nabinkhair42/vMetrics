import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Logo width={32} height={32} />
          <p className="text-center text-sm leading-loose md:text-left">
            Built with ❤️ by{" "}
            <a
              href="https://github.com/nabinkhair42"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Nabin Khair
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
} 