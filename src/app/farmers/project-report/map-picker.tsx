"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";

interface MapPickerProps {
  latitude: string;
  longitude: string;
  query: string;
  onChange: (lat: string, long: string) => void;
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
}

interface LeafletMarker {
  setLatLng: (center: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, handler: () => void) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
}

function pinHtml(): string {
  return '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#059669;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.5);"></div>';
}

export default function MapPicker({ latitude, longitude, query, onChange }: MapPickerProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const cbRef = useRef(onChange);
  useEffect(() => {
    cbRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;
    async function init() {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      if (cancelled || !divRef.current || mapRef.current) return;
      const lat = parseFloat(latitude);
      const long = parseFloat(longitude);
      const start: [number, number] =
        Number.isFinite(lat) && Number.isFinite(long) ? [lat, long] : [26.2, 78.0];
      const zoom = Number.isFinite(lat) && Number.isFinite(long) ? 15 : 5;
      const m = L.map(divRef.current).setView(start, zoom) as unknown as LeafletMap;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(m as unknown as L.Map);
      const icon = L.divIcon({ html: pinHtml(), className: "", iconSize: [26, 26], iconAnchor: [13, 24] });
      const mk = L.marker(start, { draggable: true, icon }).addTo(m as unknown as L.Map) as unknown as LeafletMarker;
      markerRef.current = mk;
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        cbRef.current(p.lat.toFixed(6), p.lng.toFixed(6));
      });
      m.on("click", (e) => {
        mk.setLatLng([e.latlng.lat, e.latlng.lng]);
        cbRef.current(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      });
      mapRef.current = m;
      map = m;
    }
    init();
    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function findVillage() {
    if (!query.trim()) {
      setNote("Enter village / tehsil / district first, then press Find.");
      return;
    }
    setLocating(true);
    setNote(null);
    try {
      const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (arr.length === 0 || !mapRef.current || !markerRef.current) {
        setNote("Location not found — tap on the map to mark the point.");
        return;
      }
      const lat = parseFloat(arr[0].lat);
      const lon = parseFloat(arr[0].lon);
      mapRef.current.setView([lat, lon], 15);
      markerRef.current.setLatLng([lat, lon]);
      cbRef.current(lat.toFixed(6), lon.toFixed(6));
      setNote("Found: " + arr[0].display_name.split(",").slice(0, 3).join(","));
    } catch {
      setNote("Map search failed — tap on the map to mark the point.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={findVillage} disabled={locating} className="gap-1.5">
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
          Find Village On Map
        </Button>
        <span className="text-xs text-muted-foreground">Then drag the pin or tap on the map — latitude/longitude below will update automatically.</span>
      </div>
      <div ref={divRef} className="h-72 w-full rounded-xl border z-0" />
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
