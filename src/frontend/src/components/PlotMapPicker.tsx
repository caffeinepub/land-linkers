import L from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
}

function MapEvents({ onPin }: MapEventsProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressCoords = useRef<L.LatLng | null>(null);

  useMapEvents({
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
  });

  return null;
}

interface PlotMapPickerProps {
  center: [number, number];
  pinnedCoords: Coords | null;
  onPin: (coords: Coords) => void;
}

export default function PlotMapPicker({
  center,
  pinnedCoords,
  onPin,
}: PlotMapPickerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  // Touch long-press handler via DOM event on the container
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
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
  }, [onPin]);

  const position: [number, number] = pinnedCoords
    ? [pinnedCoords.lat, pinnedCoords.lng]
    : center;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-border"
        style={{ height: "350px", width: "100%" }}
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
          <MapEvents onPin={onPin} />
          {pinnedCoords && (
            <Marker
              position={position}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend() {
                  const marker = markerRef.current;
                  if (marker) {
                    const latlng = marker.getLatLng();
                    onPin({ lat: latlng.lat, lng: latlng.lng });
                  }
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Long-press or click on the map to pin the exact location
      </p>
    </div>
  );
}
