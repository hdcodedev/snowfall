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
        <div data-snowfall="card" className="text-center p-8 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-xl">
          <p className="text-gray-600 dark:text-gray-300">
            Made with ❄️ by{' '}
            <a
              href="https://github.com/hdcodedev"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              hdcodedev
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
