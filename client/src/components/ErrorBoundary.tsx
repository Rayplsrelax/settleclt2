import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Check if an error originates from a browser extension (not our app code).
 * Common sources: MetaMask, Grammarly, ad blockers, password managers, etc.
 */
function isExtensionError(event: ErrorEvent | PromiseRejectionEvent): boolean {
  // Check for chrome-extension:// or moz-extension:// in the stack or source
  const stack =
    "reason" in event
      ? event.reason?.stack || String(event.reason)
      : (event as ErrorEvent).error?.stack ||
        (event as ErrorEvent).message ||
        "";
  const filename = "filename" in event ? (event as ErrorEvent).filename : "";

  const extensionPatterns = [
    "chrome-extension://",
    "moz-extension://",
    "safari-extension://",
    "ms-browser-extension://",
    "Failed to connect to MetaMask",
  ];

  return extensionPatterns.some(
    (pattern) =>
      stack?.includes(pattern) ||
      filename?.includes(pattern) ||
      String(event).includes(pattern)
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for monitoring
    console.error("[ErrorBoundary] Caught error:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  }

  componentDidMount() {
    // Global unhandled error handler
    window.addEventListener("error", (event) => {
      // Skip errors from browser extensions
      if (isExtensionError(event)) return;

      console.error("[GlobalError] Unhandled error:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    });

    // Global unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      // Skip rejections from browser extensions
      if (isExtensionError(event)) return;

      console.error("[GlobalError] Unhandled promise rejection:", {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
