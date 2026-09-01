import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import {
  CrimeNetworkNode,
  CrimeNetworkLink,
  CDRRecord,
  FinancialRecord,
  FIRRecord,
  IntelRecord,
  CellTowerSector,
  GeofenceZone,
  SuspectTrajectoryPoint,
} from "../types";
import {
  CELL_TOWER_SECTORS,
  GEOFENCE_ZONES,
  SUSPECT_TRAJECTORIES,
} from "../data/mockDatasets";
import {
  MapPin,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Shield,
  Layers,
  Radio,
  AlertTriangle,
  Flame,
  Crosshair,
  Compass,
  Zap,
  Activity,
  Users,
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

// Utility to create a polygon representing a cell tower azimuth sector wedge
function calculateSectorPoints(
  lat: number,
  lng: number,
  azimuthDeg: number,
  beamWidthDeg: number,
  radiusMeters: number,
  numPoints: number = 24
): [number, number][] {
  const points: [number, number][] = [[lat, lng]];
  const startAngle = (azimuthDeg - beamWidthDeg / 2) * (Math.PI / 180);
  const endAngle = (azimuthDeg + beamWidthDeg / 2) * (Math.PI / 180);
  const step = (endAngle - startAngle) / numPoints;

  // Approximate lat/lng delta in degrees (Earth radius ~ 6,371,000 m)
  const latDeltaDeg = radiusMeters / 111139;
  const lngDeltaDeg = radiusMeters / (111139 * Math.cos((lat * Math.PI) / 180));

  for (let i = 0; i <= numPoints; i++) {
    const angle = startAngle + i * step;
    // Azimuth: 0 = North, 90 = East, 180 = South, 270 = West
    const pLat = lat + latDeltaDeg * Math.cos(angle);
    const pLng = lng + lngDeltaDeg * Math.sin(angle);
    points.push([pLat, pLng]);
  }

  points.push([lat, lng]);
  return points;
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
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups for granular toggle control
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const towersLayerRef = useRef<L.LayerGroup | null>(null);
  const geofencesLayerRef = useRef<L.LayerGroup | null>(null);
  const trajectoryLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer Visibility Filters
  const [showTowers, setShowTowers] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showSafehouses, setShowSafehouses] = useState(true);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "streets">("dark");

  // Timeline events unified
  const allEvents = useMemo(() => {
    return [
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
  }, [firs, cdrs, financials, intels]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(allEvents.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [18.98, 72.9],
      zoom: 10,
      attributionControl: false,
    });

    const tileUrls = {
      dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    };

    const baseLayer = L.tileLayer(tileUrls[mapStyle], {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    baseTileLayerRef.current = baseLayer;

    // Create sublayer groups
    towersLayerRef.current = L.layerGroup().addTo(map);
    geofencesLayerRef.current = L.layerGroup().addTo(map);
    trajectoryLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Map Style
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    const tileUrls = {
      dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    };

    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    const newBase = L.tileLayer(tileUrls[mapStyle], { maxZoom: 19, subdomains: "abcd" }).addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newBase;
  }, [mapStyle]);

  // Render Cell Towers & Azimuth Cones
  useEffect(() => {
    if (!towersLayerRef.current || !mapInstanceRef.current) return;
    const layer = towersLayerRef.current;
    layer.clearLayers();

    if (!showTowers) return;

    CELL_TOWER_SECTORS.forEach((twr) => {
      // 1. Azimuth Wedge Polygon
      const sectorPolygon = calculateSectorPoints(
        twr.lat,
        twr.lng,
        twr.azimuthDeg,
        twr.beamWidthDeg,
        twr.radiusMeters
      );

      const sector = L.polygon(sectorPolygon, {
        color: "#38bdf8",
        weight: 1.5,
        fillColor: "#0284c7",
        fillOpacity: 0.18,
        dashArray: "3,3",
      }).addTo(layer);

      sector.bindPopup(`
        <div class="p-2 font-mono text-xs">
          <strong class="text-sky-600 block text-sm">${twr.towerName}</strong>
          <span class="text-slate-600 block">BTS ID: ${twr.towerId}</span>
          <div class="mt-2 border-t pt-1 space-y-0.5">
            <div>Azimuth: <strong>${twr.azimuthDeg}° (Beam: ${twr.beamWidthDeg}°)</strong></div>
            <div>Radius: <strong>${(twr.radiusMeters / 1000).toFixed(1)} km</strong></div>
            <div>Operator: <strong>${twr.operator}</strong></div>
            <div>Active Calls Logged: <strong>${twr.activeCallsCount} calls</strong></div>
          </div>
        </div>
      `);

      // 2. Tower Center Pin
      const towerIcon = L.divIcon({
        className: "custom-tower-marker",
        html: `
          <div style="background-color: #0284c7; width: 22px; height: 22px; border-radius: 4px; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 0 8px rgba(0,0,0,0.6);">
            📡
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([twr.lat, twr.lng], { icon: towerIcon })
        .bindTooltip(`BTS: ${twr.towerName} (${twr.azimuthDeg}°)`, { sticky: true })
        .addTo(layer);
    });
  }, [showTowers]);

  // Render Geofences
  useEffect(() => {
    if (!geofencesLayerRef.current || !mapInstanceRef.current) return;
    const layer = geofencesLayerRef.current;
    layer.clearLayers();

    if (!showGeofences) return;

    GEOFENCE_ZONES.forEach((zone) => {
      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radiusMeters,
        color: zone.alertTriggered ? "#ef4444" : "#f59e0b",
        weight: 2,
        fillColor: zone.alertTriggered ? "#ef4444" : "#f59e0b",
        fillOpacity: 0.15,
        dashArray: "5,5",
      }).addTo(layer);

      circle.bindPopup(`
        <div class="p-2 font-mono text-xs">
          <strong class="text-rose-600 block text-sm font-bold">${zone.name}</strong>
          <span class="text-slate-600 block">Surveillance Category: ${zone.category}</span>
          <div class="mt-2 border-t pt-1">
            <div>Perimeter Radius: <strong>${zone.radiusMeters}m</strong></div>
            <div>Suspects Tracked Inside: <strong class="text-rose-700">${zone.activeSuspectsInside.join(", ")}</strong></div>
            <div class="mt-1 text-red-600 font-bold">${zone.alertTriggered ? "⚠️ ACTIVE GEOFENCE BREACH DETECTED" : "✓ Perimeter Secure"}</div>
          </div>
        </div>
      `);
    });
  }, [showGeofences]);

  // Render Suspect Trajectories & Co-Location Hotspots
  useEffect(() => {
    if (!trajectoryLayerRef.current || !mapInstanceRef.current) return;
    const layer = trajectoryLayerRef.current;
    layer.clearLayers();

    if (!showTrajectories) return;

    // Group trajectory points by suspect
    const suspectTrajectories: { [suspectId: string]: SuspectTrajectoryPoint[] } = {};
    SUSPECT_TRAJECTORIES.forEach((pt) => {
      if (!suspectTrajectories[pt.suspectId]) suspectTrajectories[pt.suspectId] = [];
      suspectTrajectories[pt.suspectId].push(pt);
    });

    const suspectColors: { [id: string]: string } = {
      "p-feroz": "#f59e0b", // Amber
      "p-tariq": "#06b6d4", // Cyan
    };

    Object.entries(suspectTrajectories).forEach(([suspectId, points]) => {
      const color = suspectColors[suspectId] || "#a855f7";
      const coords: [number, number][] = points.map((p) => [p.lat, p.lng]);

      // Connect trajectory with animated dashline
      L.polyline(coords, {
        color: color,
        weight: 3.5,
        opacity: 0.85,
        dashArray: "8,6",
      })
        .bindTooltip(`Suspect Trajectory: ${points[0].suspectName}`, { sticky: true })
        .addTo(layer);

      // Plot Breadcrumb Points
      points.forEach((pt, idx) => {
        const isDeadDrop = pt.locationLabel.includes("Dead-Drop") || pt.locationLabel.includes("Co-Location");

        const breadcrumbHtml = `
          <div style="background-color: ${isDeadDrop ? "#ef4444" : color}; width: ${isDeadDrop ? "22px" : "16px"}; height: ${isDeadDrop ? "22px" : "16px"}; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: #0f172a; font-weight: bold; font-size: 9px; box-shadow: 0 0 8px ${color};">
            ${isDeadDrop ? "⚠️" : idx + 1}
          </div>
        `;

        const icon = L.divIcon({
          className: "traj-breadcrumb",
          html: breadcrumbHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([pt.lat, pt.lng], { icon })
          .bindPopup(`
            <div class="p-2 font-mono text-xs">
              <strong class="block text-sm" style="color: ${color}">${pt.suspectName}</strong>
              <div class="text-slate-600">${pt.locationLabel}</div>
              <div class="mt-2 border-t pt-1 space-y-0.5">
                <div>Timestamp: <strong>${pt.timestamp}</strong></div>
                <div>Recorded Speed: <strong>${pt.speedKmh} km/h</strong></div>
                <div>Signal Type: <strong>${pt.activityType}</strong></div>
                ${pt.towerAzimuth ? `<div>Azimuth Alignment: <strong>${pt.towerAzimuth}°</strong></div>` : ""}
              </div>
            </div>
          `)
          .addTo(layer);
      });
    });
  }, [showTrajectories]);

  // Render Safehouse Nodes & Evidence Markers
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    if (!showSafehouses) return;

    const geoNodes = nodes.filter((n) => n.details?.geo?.lat && n.details?.geo?.lng);
    geoNodes.forEach((node) => {
      const geo = node.details!.geo!;
      const isKingpin = node.isKingpinCandidate;

      const markerHtml = `
        <div style="
          background-color: ${isKingpin ? "#f59e0b" : "#ef4444"};
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 12px rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          font-weight: bold;
          font-size: 12px;
        ">
          ${isKingpin ? "★" : "⚲"}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-geo-marker",
        html: markerHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([geo.lat, geo.lng], { icon: customIcon });
      marker.bindPopup(`
        <div class="p-2 font-mono text-xs">
          <strong class="text-sm font-bold text-slate-900 block">${node.label}</strong>
          <span class="text-slate-600 block">${node.role || node.type}</span>
          <p class="mt-1 text-slate-700">${geo.name || "Geo Coordinates"}</p>
        </div>
      `);
      marker.addTo(layer);
    });
  }, [nodes, showSafehouses]);

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
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                GIS FORENSIC SUITE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                CELL AZIMUTHS & CO-LOCATION INTERCEPT
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-0.5">
              Geospatial & Spatio-Temporal Intelligence Map
            </h2>
          </div>
        </div>

        {/* Tactical Layer Filters & Tile Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          {/* Layer Toggles */}
          <button
            onClick={() => setShowTowers(!showTowers)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
              showTowers ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "text-slate-500 line-through"
            }`}
            title="Toggle Cell Towers and 120° Azimuth Beam Cones"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Towers ({CELL_TOWER_SECTORS.length})</span>
          </button>

          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
              showGeofences ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-slate-500 line-through"
            }`}
            title="Toggle Surveillance Geofences"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Geofences ({GEOFENCE_ZONES.length})</span>
          </button>

          <button
            onClick={() => setShowTrajectories(!showTrajectories)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
              showTrajectories ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-500 line-through"
            }`}
            title="Toggle Suspect GPS Trajectory Trails"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Trajectories</span>
          </button>

          {/* Map Tile Theme Switcher */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => setMapStyle("dark")}
              className={`px-2 py-1 rounded text-[10px] font-mono ${mapStyle === "dark" ? "bg-slate-800 text-slate-100 font-bold" : "text-slate-400"}`}
            >
              Dark Ops
            </button>
            <button
              onClick={() => setMapStyle("satellite")}
              className={`px-2 py-1 rounded text-[10px] font-mono ${mapStyle === "satellite" ? "bg-slate-800 text-slate-100 font-bold" : "text-slate-400"}`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle("streets")}
              className={`px-2 py-1 rounded text-[10px] font-mono ${mapStyle === "streets" ? "bg-slate-800 text-slate-100 font-bold" : "text-slate-400"}`}
            >
              Streets
            </button>
          </div>
        </div>
      </div>

      {/* Main Map & Interactive Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[560px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Map Legend & Co-Location Alert */}
          <div className="absolute top-3 left-3 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex flex-col gap-2 shadow-2xl">
            <div className="flex items-center gap-3 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="font-bold text-amber-300">Feroz Trajectory</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="font-bold text-cyan-300">Tariq Trajectory</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-500"></span>
                <span className="text-sky-300">120° BTS Sector</span>
              </span>
            </div>

            {/* Co-Location Alert Callout */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-[10px] text-rose-300 leading-tight">
                <strong>Co-Location Detected:</strong> Feroz & Tariq met at Nhava Sheva (23:05 - 23:15) within 45m radius.
              </span>
            </div>
          </div>
        </div>

        {/* Chronological Incident Trail & Event Scrubber */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-[560px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Chronological Trail ({allEvents.length} Events)
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(0);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Timeline Range Slider */}
            <input
              type="range"
              min="0"
              max={Math.max(0, allEvents.length - 1)}
              value={currentStepIndex}
              onChange={(e) => setCurrentStepIndex(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 mb-3 cursor-pointer"
            />

            {/* Event List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[410px] pr-1">
              {allEvents.map((ev, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? "bg-slate-800 border-amber-500 shadow-lg scale-[1.01]"
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
                        {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <strong className="block text-slate-100 font-semibold mb-0.5">{ev.title}</strong>
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
