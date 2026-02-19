import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, X, Check } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onSave: (croppedImageData: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onSave, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      drawCanvas(img, zoom, position);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (image) {
      drawCanvas(image, zoom, position);
    }
  }, [zoom, position, image]);

  const drawCanvas = (img: HTMLImageElement, currentZoom: number, currentPosition: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, size, size);

    const scale = (size / Math.min(img.width, img.height)) * currentZoom;
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    const x = (size - scaledWidth) / 2 + currentPosition.x;
    const y = (size - scaledHeight) / 2 + currentPosition.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    ctx.restore();

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = 400;
    croppedCanvas.height = 400;
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    croppedCanvas.toBlob((blob) => {
      if (!blob) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        onSave(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Modifica immagine festeggiato</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <Move className="w-4 h-4 inline mr-1" />
            Trascina per spostare l'immagine
          </p>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`border-4 border-gray-200 rounded-full shadow-lg ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Zoom</span>
            <span className="text-sm text-gray-500">{(zoom * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}
