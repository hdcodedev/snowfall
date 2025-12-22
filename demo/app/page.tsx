import ToggleButton from '@/components/ToggleButton';
import ControlsPanel from '@/components/ControlsPanel';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ToggleButton />
      <ControlsPanel />

      <header className="py-12 text-center text-gray-900 dark:text-white">
        <div className="inline-block p-8 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
          <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
            @hdcodedev/snowfall
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto">
            Realistic snow effect for React with physics-based accumulation
          </p>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center container mx-auto px-4 py-8">
        {/* Installation Section */}
        <div data-snowfall="top" className="w-full max-w-3xl p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Quick Start</h2>

          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <code className="text-green-400">npm install @hdcodedev/snowfall</code>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
              <code className="text-gray-900 dark:text-gray-100">{`import { Snowfall, SnowfallProvider } from '@hdcodedev/snowfall';

function App() {
  return (
    <SnowfallProvider>
      <Snowfall />
      {/* Your content */}
    </SnowfallProvider>
  );
}`}</code>
            </pre>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 pb-8">
        <div className="text-center p-8 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-xl">
          <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1">
            Made with ❄️ by{' '}
            <a
              href="https://github.com/hdcodedev"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              hdcodedev
            </a>
            {' '}&{' '}
            <span title="AI Agents" className="relative bottom-[1px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8.01" y2="16" />
                <line x1="16" y1="16" x2="16.01" y2="16" />
              </svg>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
