import { Gift } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#3b82f6] flex flex-col items-center justify-center z-50">
      <div className="relative mb-12">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <Gift className="w-32 h-32 text-white opacity-95 animate-pulse" strokeWidth={1.5} />
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full opacity-95"></div>
              <div className="w-6 h-6 bg-red-500 rounded-full opacity-95"></div>
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full opacity-95"></div>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-white mb-2 opacity-95">
        PartyPool
      </h1>

      <div className="flex gap-2 mt-4">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce opacity-75" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce opacity-75" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce opacity-75" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
