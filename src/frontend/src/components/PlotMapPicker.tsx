import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2 } from "lucide-react";

// Fix Leaflet default icon issue
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Coords {
  lat: number;
  lng: number;
}

interface MapEventsProps {
  onPin: (coords: Coords) => void;
  readOnly?: boolean;
}

function MapEvents({ onPin, readOnly }: MapEventsProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressCoords = useRef<L.LatLng | null>(null);

  useMapEvents(
    readOnly
      ? {}
      : {
          click(e) {
            onPin({ lat: e.latlng.lat, lng: e.latlng.lng });
          },
          mousedown(e) {
            longPressCoords.current = e.latlng;
            longPressTimer.current = setTimeout(() => {
              if (longPressCoords.current) {
                onPin({
                  lat: longPressCoords.current.lat,
                  lng: longPressCoords.current.lng,
                });
              }
            }, 600);
          },
          mouseup() {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          },
          mousemove() {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          },
        },
  );

  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  return null;
}

export interface PlotMapPickerProps {
  center: [number, number];
  pinnedCoords: Coords | null;
  onPin: (coords: Coords) => void;
  onConfirm?: (coords: Coords) => void;
  readOnly?: boolean;
}

export default function PlotMapPicker({
  center,
  pinnedCoords,
  onPin,
  onConfirm,
  readOnly = false,
}: PlotMapPickerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Touch long-press handler
  useEffect(() => {
    if (readOnly) return;
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
      touchTimer.current = setTimeout(() => {
        if (mapInstanceRef.current && touchStart.current) {
          const rect = el.getBoundingClientRect();
          const x = touchStart.current.x - rect.left;
          const y = touchStart.current.y - rect.top;
          const latlng = mapInstanceRef.current.containerPointToLatLng([x, y]);
          onPin({ lat: latlng.lat, lng: latlng.lng });
        }
      }, 600);
    };

    const handleTouchEnd = () => {
      if (touchTimer.current) {
        clearTimeout(touchTimer.current);
        touchTimer.current = null;
      }
    };

    const handleTouchMove = () => {
      if (touchTimer.current) {
        clearTimeout(touchTimer.current);
        touchTimer.current = null;
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    el.addEventListener("touchmove", handleTouchMove);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [onPin, readOnly]);

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapInstanceRef.current?.setView([coords.lat, coords.lng], 16);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
    );
  };

  const position: [number, number] = pinnedCoords
    ? [pinnedCoords.lat, pinnedCoords.lng]
    : center;

  const showConfirmBar = !readOnly && !!onConfirm && pinnedCoords !== null;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-border"
        style={{ height: "350px", width: "100%", position: "relative" }}
      >
        <MapContainer
          center={center}
          zoom={16}
          style={{ height: "350px", width: "100%" }}
          ref={(map) => {
            if (map) mapInstanceRef.current = map;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={center} />
          <MapEvents onPin={onPin} readOnly={readOnly} />
          {pinnedCoords && (
            <Marker
              position={position}
              draggable={!readOnly}
              ref={markerRef}
              eventHandlers={
                readOnly
                  ? {}
                  : {
                      dragend() {
                        const marker = markerRef.current;
                        if (marker) {
                          const latlng = marker.getLatLng();
                          onPin({ lat: latlng.lat, lng: latlng.lng });
                        }
                      },
                    }
              }
            />
          )}
        </MapContainer>

        {/* My Location button — floating top-right */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleMyLocation}
            disabled={isLocating}
            style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
            className="bg-white rounded-lg shadow-md px-3 py-2 text-sm font-medium flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
            title="Center on my location"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Crosshair className="w-4 h-4 text-primary" />
            )}
            <span className="text-xs">My Location</span>
          </button>
        )}

        {/* Confirm bar — overlaid at bottom */}
        {showConfirmBar && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
            className="bg-white/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center justify-between gap-3"
          >
            <span className="text-xs text-foreground font-medium">
              📍 Lat: {pinnedCoords!.lat.toFixed(5)}, Lng:{" "}
              {pinnedCoords!.lng.toFixed(5)}
            </span>
            <button
              type="button"
              onClick={() => onConfirm!(pinnedCoords!)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Confirm Location
            </button>
          </div>
        )}
      </div>
      {!readOnly && (
        <p className="text-xs text-muted-foreground text-center">
          Long-press or click on the map to pin the exact location
        </p>
      )}
    </div>
  );
}
