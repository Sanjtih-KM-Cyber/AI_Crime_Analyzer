import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  CrimeNetworkNode,
  CrimeNetworkLink,
  CDRRecord,
  FinancialRecord,
  FIRRecord,
  IntelRecord,
} from "../types";
import {
  MapPin,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Shield,
  Layers,
  Calendar,
  Eye,
} from "lucide-react";

interface GeoTimelineViewProps {
  nodes: CrimeNetworkNode[];
  links: CrimeNetworkLink[];
  firs: FIRRecord[];
  cdrs: CDRRecord[];
  financials: FinancialRecord[];
  intels: IntelRecord[];
  onSelectNode: (node: CrimeNetworkNode) => void;
}

export const GeoTimelineView: React.FC<GeoTimelineViewProps> = ({
  nodes,
  links,
  firs,
  cdrs,
  financials,
  intels,
  onSelectNode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Timeline events unified
  const allEvents = [
    ...firs.map((f) => ({
      id: f.id,
      type: "FIR",
      title: `${f.firNumber} Registered`,
      timestamp: f.date,
      description: f.briefNarrative,
      badge: "POLICE FIR",
      color: "#ef4444",
      lat: 18.9614,
      lng: 72.8373,
    })),
    ...cdrs.map((c) => ({
      id: c.id,
      type: "CDR",
      title: `Call Intercept: ${c.aParty} → ${c.bParty}`,
      timestamp: c.timestamp,
      description: `Duration: ${c.durationSec}s at ${c.towerLocation} (IMEI: ${c.imeiA})`,
      badge: "CDR LOG",
      color: "#38bdf8",
      lat: c.lat,
      lng: c.lng,
    })),
    ...financials.map((fn) => ({
      id: fn.id,
      type: "FINANCIAL",
      title: `₹${(fn.amount / 100000).toFixed(1)}L Transfer: ${fn.senderName} → ${fn.receiverName}`,
      timestamp: fn.timestamp,
      description: `Mode: ${fn.mode} [UTR: ${fn.utrNumber}]`,
      badge: "HAWALA / BANK",
      color: "#10b981",
      lat: 18.9507,
      lng: 72.8315,
    })),
    ...intels.map((it) => ({
      id: it.id,
      type: "INTEL",
      title: `Surveillance Sighting at ${it.location}`,
      timestamp: it.date,
      description: it.description,
      badge: "HUMINT / INTEL",
      color: "#f59e0b",
      lat: it.lat,
      lng: it.lng,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(allEvents.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [18.95, 73.2],
      zoom: 7,
      attributionControl: false,
    });

    // Dark Tile Layer (OpenStreetMap / Carto Dark)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers based on nodes and timeline step
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // 1. Plot Geo-tagged Nodes (Safehouses, Ports, Towers, Addresses)
    const geoNodes = nodes.filter((n) => n.details?.geo?.lat && n.details?.geo?.lng);
    const bounds: L.LatLngExpression[] = [];

    geoNodes.forEach((node) => {
      const geo = node.details!.geo!;
      const isKingpin = node.isKingpinCandidate;

      const markerHtml = `
        <div style="
          background-color: ${isKingpin ? "#f59e0b" : "#ef4444"};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          font-weight: bold;
          font-size: 11px;
        ">
          ${isKingpin ? "★" : "⚲"}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-geo-marker",
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([geo.lat, geo.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; padding: 4px;">
          <strong style="font-size: 13px; display: block; margin-bottom: 2px;">${node.label}</strong>
          <span style="font-size: 11px; color: #64748b; display: block;">${node.role || node.type}</span>
          <p style="font-size: 11px; margin: 4px 0 0;">${geo.name || "Geo Location"}</p>
        </div>
      `);

      marker.addTo(markersLayer);
      bounds.push([geo.lat, geo.lng]);
    });

    // 2. Draw Movement Trails / Routes (e.g. Nhava Sheva to Goa)
    const routeCoords: [number, number][] = [
      [18.953, 72.956], // Nhava Sheva
      [19.033, 73.0297], // Navi Mumbai
      [18.9614, 72.8373], // Dongri
      [15.543, 73.7554], // Calangute Goa
      [15.584, 73.742], // Anjuna Safehouse
    ];

    const polyline = L.polyline(routeCoords, {
      color: "#f59e0b",
      weight: 3,
      opacity: 0.7,
      dashArray: "6,6",
    }).addTo(markersLayer);

    polyline.bindTooltip("Narcotics Transit & Escort Corridor (NH 66)", { sticky: true });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
  }, [nodes]);

  // Playback Auto-Stepper
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= allEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, allEvents.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Geospatial & Spatio-Temporal Intelligence Map
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live mapping of cell tower pings, transit corridors, container yards, and safehouse nodes across jurisdictions.
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-md transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause Timeline" : "Play Timeline"}</span>
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded"
            title="Reset to Start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl h-[520px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Top Floating Overlay */}
          <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3 shadow">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Kingpin Overseas Node
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Safehouse / Raid Site
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-400 border-dashed"></span> Transit Corridor
            </span>
          </div>
        </div>

        {/* Chronological Event Scrubber List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between h-[520px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Chronological Incident Trail ({allEvents.length} Events)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Step {currentStepIndex + 1} of {allEvents.length}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max={Math.max(0, allEvents.length - 1)}
              value={currentStepIndex}
              onChange={(e) => setCurrentStepIndex(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 mb-4"
            />

            {/* Event List */}
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {allEvents.map((ev, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isCurrent
                        ? "bg-slate-800 border-amber-500 shadow-md"
                        : isActive
                        ? "bg-slate-950/80 border-slate-800 text-slate-300"
                        : "bg-slate-950/30 border-slate-900 opacity-40 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                        style={{
                          backgroundColor: `${ev.color}20`,
                          color: ev.color,
                          border: `1px solid ${ev.color}40`,
                        }}
                      >
                        {ev.badge}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <strong className="block text-slate-100 font-semibold mb-1">{ev.title}</strong>
                    <p className="text-[11px] text-slate-400 leading-normal">{ev.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
