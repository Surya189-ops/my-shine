// app/components/TypingIndicator.tsx
"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fadeIn">
      <div className="flex gap-1">
        <span 
          className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" 
          style={{ animationDelay: "0ms", animationDuration: "1s" }} 
        />
        <span 
          className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" 
          style={{ animationDelay: "150ms", animationDuration: "1s" }} 
        />
        <span 
          className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" 
          style={{ animationDelay: "300ms", animationDuration: "1s" }} 
        />
      </div>
    </div>
  );
}