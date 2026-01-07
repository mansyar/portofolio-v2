import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-(--color-surface) p-8 rounded-lg border border-(--color-border) max-w-md w-full shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="bg-(--color-surface-dark) p-4 rounded-full border border-(--color-border)">
            <AlertTriangle size={48} className="text-(--color-terminal-red)" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">404: Page Not Found</h1>
        <p className="text-(--color-text-secondary) mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex justify-center">
          <Link 
            to="/" 
            className="px-6 py-2 bg-(--color-ubuntu-orange) text-white font-bold rounded hover:opacity-90 transition-opacity"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
