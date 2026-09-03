export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-[10px] bg-lavender-soft flex items-center justify-center animate-pulse">
          <span className="text-primary font-display font-bold text-sm">U</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "200ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}
