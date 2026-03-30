import L from "leaflet";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getListings, getPhotos } from "../utils/firebaseStore";

// Fix Leaflet default icon
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface PhotoSlideshowPageProps {
  photoId: string;
}

export function PhotoSlideshowPage({ photoId }: PhotoSlideshowPageProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [blink, setBlink] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    Promise.all([getPhotos(photoId), getListings()]).then(
      ([fetchedPhotos, listings]) => {
        setPhotos(fetchedPhotos);
        const listing = listings.find((l) => l.photoLinkId === photoId);
        if (listing?.lat && listing?.lng) {
          setCoords({ lat: listing.lat, lng: listing.lng });
        }
      },
    );
  }, [photoId]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % photos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [photos.length]);

  useEffect(() => {
    const blinkInterval = setInterval(() => setBlink((b) => !b), 600);
    return () => clearInterval(blinkInterval);
  }, []);

  const prev = () =>
    setCurrentIdx((prev) => (prev - 1 + photos.length) % photos.length);
  const next = () => setCurrentIdx((prev) => (prev + 1) % photos.length);

  return (
    <div className="fixed inset-0 z-50 bg-black font-mono text-green-400 flex flex-col overflow-hidden">
      {/* Terminal Header */}
      <div className="border-b border-green-800 px-6 py-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-green-400 hover:text-green-300 flex items-center gap-1 text-sm transition-colors"
          data-ocid="slideshow.secondary_button"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex-1 text-center">
          <span className="text-green-600 text-xs">LAND LINKERS</span>
        </div>
        <div className="text-xs text-green-700">ID: {photoId}</div>
      </div>

      {/* Terminal path bar */}
      <div className="px-6 py-2 text-xs text-green-700 border-b border-green-900">
        <span className="text-green-500">root@landlinkers</span>
        <span className="text-green-700">:</span>
        <span className="text-green-400">~/photos/{photoId}</span>
        <span
          className={`ml-1 ${blink ? "opacity-100" : "opacity-0"} transition-opacity`}
        >
          █
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full py-16">
            <div className="text-green-700 text-sm">
              $ cat photos/{photoId}/*
            </div>
            <div className="text-red-500 text-sm">
              Error: No photos found for this link.
            </div>
            <div className="text-green-700 text-xs mt-2">
              The photos may have been cleared from local storage.
            </div>
          </div>
        ) : (
          <>
            {/* Index counter */}
            <div className="px-6 py-2 text-xs text-green-600">
              $ display --slide {currentIdx + 1}/{photos.length} --format
              slideshow
            </div>

            {/* Main photo display */}
            <div className="flex items-center justify-center relative px-4 pb-4">
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 z-10 w-10 h-10 rounded-full border border-green-800 bg-black/80 flex items-center justify-center hover:border-green-500 hover:text-green-300 transition-colors"
                data-ocid="slideshow.secondary_button"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="max-w-3xl w-full">
                <div
                  className="border border-green-800 rounded-lg overflow-hidden relative"
                  style={{ boxShadow: "0 0 30px rgba(0,255,65,0.1)" }}
                >
                  {/* Scanlines overlay */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none opacity-5"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.3) 2px, rgba(0,255,65,0.3) 4px)",
                    }}
                  />
                  <img
                    src={photos[currentIdx]}
                    alt={`Plot ${currentIdx + 1} of ${photos.length}`}
                    className="w-full max-h-[60vh] object-contain bg-black"
                  />
                </div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {photos.map((photo, i) => (
                    <button
                      key={photo.slice(0, 20)}
                      type="button"
                      onClick={() => setCurrentIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentIdx
                          ? "bg-green-400 scale-125"
                          : "bg-green-800 hover:bg-green-700"
                      }`}
                      data-ocid="slideshow.toggle"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={next}
                className="absolute right-4 z-10 w-10 h-10 rounded-full border border-green-800 bg-black/80 flex items-center justify-center hover:border-green-500 hover:text-green-300 transition-colors"
                data-ocid="slideshow.secondary_button"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Plot Location Map */}
            {coords && (
              <div className="px-6 pb-6">
                <div className="text-xs text-green-500 mb-2">
                  $ show --location --coords {coords.lat.toFixed(5)},
                  {coords.lng.toFixed(5)}
                </div>
                <div
                  className="border border-green-800 rounded-lg overflow-hidden"
                  style={{ height: 250 }}
                >
                  <MapContainer
                    center={[coords.lat, coords.lng]}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    dragging={false}
                    doubleClickZoom={false}
                    scrollWheelZoom={false}
                    touchZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[coords.lat, coords.lng]} />
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Footer status */}
            <div className="px-6 py-2 border-t border-green-900 text-xs text-green-700">
              [Auto-advance: 3s] [Total: {photos.length} photos] [Use arrow
              buttons or wait]
            </div>
          </>
        )}
      </div>
    </div>
  );
}
