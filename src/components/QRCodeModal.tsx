import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface QRCodeModalProps {
  url: string;
  eventName: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, eventName, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [url]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {t('event.qrTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 rounded-xl p-6 mb-4">
            <canvas ref={canvasRef} className="mx-auto" />
          </div>

          <h3 className="font-bold text-lg text-gray-800 mb-2">{eventName}</h3>
          <p className="text-gray-600 text-sm mb-4">
            {t('event.qrDesc')}
          </p>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 break-all">
            {url}
          </div>
        </div>
      </div>
    </div>
  );
}
