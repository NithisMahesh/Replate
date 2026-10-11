import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Collection,
  FoodDonation,
  Provider,
  NGO,
  StopProgressStatus,
  VehiclePosition,
} from '../../types/surplusLink';
import { derivedCollectionStops, DerivedStop } from '../../selectors';
import {
  Truck,
  MapPin,
  Play,
  Pause,
  FastForward,
  Navigation,
  Radio,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Crosshair,
} from 'lucide-react';
import { haversineRoadDistanceKm } from '../../utils/collectionPlanner';

interface PickupsRouteMapProps {
  trip: Collection;
  donations: FoodDonation[];
  providers: Provider[];
  ngo: NGO;
  onUpdateStopProgress: (
    collectionId: string,
    donationId: string,
    newStatus: StopProgressStatus,
    actualQty?: number,
    failReason?: string
  ) => void;
  onUpdateVehiclePosition?: (
    collectionId: string,
    vehiclePosition: VehiclePosition,
    routeProgress?: number
  ) => void;
  isVisible?: boolean;
}

const BROADCAST_CHANNEL_NAME = 'replate_vehicle_tracking';

export const PickupsRouteMap: React.FC<PickupsRouteMapProps> = ({
  trip,
  donations,
  providers,
  ngo,
  onUpdateStopProgress,
  onUpdateVehiclePosition,
  isVisible = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const remainingPolylineRef = useRef<L.Polyline | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  // Simulation controls state
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 5 | 20>(5);
  const [trackingMode, setTrackingMode] = useState<'simulated' | 'device'>('simulated');
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('Just now');
  const [reachedStopPrompt, setReachedStopPrompt] = useState<DerivedStop | null>(null);

  const stops = useMemo(() => derivedCollectionStops(trip, donations, providers), [trip, donations, providers]);

  // Extract polyline coordinates from trip route, ensuring NGO start and end
  const polylineCoords = useMemo<[number, number][]>(() => {
    if (trip.route.polyline && trip.route.polyline.length >= 2) {
      return trip.route.polyline;
    }
    // Fallback: Haversine straight line path NGO -> Stops -> NGO
    const coords: [number, number][] = [[ngo.lat, ngo.lng]];
    stops.forEach((s) => coords.push([s.provider.lat, s.provider.lng]));
    coords.push([ngo.lat, ngo.lng]);
    return coords;
  }, [trip.route.polyline, ngo.lat, ngo.lng, stops]);

  // Precompute cumulative distances along polyline in kilometers
  const { totalRouteKm, cumDistances } = useMemo(() => {
    let total = 0;
    const distances: number[] = [0];
    for (let i = 0; i < polylineCoords.length - 1; i++) {
      const p1 = polylineCoords[i];
      const p2 = polylineCoords[i + 1];
      const segmentKm = haversineRoadDistanceKm(p1[0], p1[1], p2[0], p2[1]) / 1.35; // raw haversine
      total += segmentKm;
      distances.push(total);
    }
    return { totalRouteKm: Math.max(0.1, total), cumDistances: distances };
  }, [polylineCoords]);

  // Current progress (0 to 1) and position
  const [progress, setProgress] = useState<number>(trip.routeProgress ?? 0.0);
  const progressRef = useRef<number>(progress);
  progressRef.current = progress;

  // Calculate position coordinate [lat, lng] from progress
  const getCoordAtProgress = useCallback(
    (prog: number): [number, number] => {
      const targetDist = Math.max(0, Math.min(1, prog)) * totalRouteKm;
      for (let i = 0; i < cumDistances.length - 1; i++) {
        const d1 = cumDistances[i];
        const d2 = cumDistances[i + 1];
        if (targetDist >= d1 && targetDist <= d2) {
          const segLen = d2 - d1;
          const ratio = segLen > 0 ? (targetDist - d1) / segLen : 0;
          const lat = polylineCoords[i][0] + ratio * (polylineCoords[i + 1][0] - polylineCoords[i][0]);
          const lng = polylineCoords[i][1] + ratio * (polylineCoords[i + 1][1] - polylineCoords[i][1]);
          return [lat, lng];
        }
      }
      return polylineCoords[polylineCoords.length - 1] || [ngo.lat, ngo.lng];
    },
    [cumDistances, totalRouteKm, polylineCoords, ngo.lat, ngo.lng]
  );

  const currentVehicleLatLng = useMemo(() => {
    if (trip.vehiclePosition && trackingMode === 'device') {
      return [trip.vehiclePosition.lat, trip.vehiclePosition.lng] as [number, number];
    }
    return getCoordAtProgress(progress);
  }, [trip.vehiclePosition, trackingMode, getCoordAtProgress, progress]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [ngo.lat, ngo.lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      baseLayersGroupRef.current = L.layerGroup().addTo(map);

      completedPolylineRef.current = L.polyline([], {
        color: '#059669',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      remainingPolylineRef.current = L.polyline([], {
        color: '#2563eb',
        weight: 4,
        opacity: 0.85,
        dashArray: '7, 9',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ngo.lat, ngo.lng]);

  // Invalidate map size when tab or trip changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (isVisible) {
      map.invalidateSize();
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, trip.id]);

  // Render Base Layers: NGO Hub and Numbered Stops colored by status
  useEffect(() => {
    const map = mapInstanceRef.current;
    const baseGroup = baseLayersGroupRef.current;
    if (!map || !baseGroup) return;

    baseGroup.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. NGO Hub Marker
    const ngoLatLng: [number, number] = [ngo.lat, ngo.lng];
    bounds.extend(ngoLatLng);

    const ngoIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background-color: #059669;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 10px;
          cursor: pointer;
        ">
          <span>NGO</span>
          <span style="font-size: 7px; font-weight: 700; opacity: 0.9;">DEPOT</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20],
    });

    const ngoMarker = L.marker(ngoLatLng, { icon: ngoIcon });
    ngoMarker.bindPopup(`
      <div style="font-size: 12px; font-family: inherit;">
        <strong>NGO Depot (Trip Base)</strong><br />
        ${ngo.name}<br />
        <small style="color: #64748b;">Route Start & End Point</small>
      </div>
    `);
    baseGroup.addLayer(ngoMarker);

    // 2. Numbered Stops in Order colored by Status
    stops.forEach((stop, idx) => {
      const sLatLng: [number, number] = [stop.provider.lat, stop.provider.lng];
      bounds.extend(sLatLng);

      let statusColor = '#1e293b'; // Pending: slate
      if (stop.status === 'En route') statusColor = '#f59e0b'; // Amber
      else if (stop.status === 'Arrived') statusColor = '#0284c7'; // Sky
      else if (stop.status === 'Collected') statusColor = '#059669'; // Emerald
      else if (stop.status === 'Failed') statusColor = '#e11d48'; // Rose

      const stopIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${statusColor};
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
          ">
            <span>${idx + 1}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(sLatLng, { icon: stopIcon });
      const popupHtml = `
        <div style="font-size: 12px; font-family: inherit; min-width: 200px;">
          <div style="font-size: 10px; font-weight: 800; color: ${statusColor}; text-transform: uppercase;">
            Stop #${idx + 1} • ${stop.status}
          </div>
          <strong style="font-size: 13px; color: #0f172a;">${stop.provider.name}</strong>
          <div style="color: #64748b; font-size: 11px; margin: 2px 0;">${stop.provider.address}</div>
          <div style="border-top: 1px solid #e2e8f0; margin-top: 6px; padding-top: 6px; font-size: 11px;">
            <div><strong>Item:</strong> ${stop.donation.foodItem}</div>
            <div><strong>Portions:</strong> ${stop.confirmedPortions} portions</div>
            <div><strong>Deadline:</strong> <span style="color: #c2410c; font-weight: 700;">${stop.donation.collectionDeadline}</span></div>
            <div><strong>OTP:</strong> <code>${stop.donation.verificationOtp}</code></div>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      baseGroup.addLayer(marker);
    });

    // Extend bounds with full polyline coordinates
    polylineCoords.forEach((pt) => bounds.extend(pt));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
    }
  }, [trip.id, stops, polylineCoords, ngo]);

  // Update Route Polylines: Solid for completed, Dashed for remaining
  useEffect(() => {
    if (!completedPolylineRef.current || !remainingPolylineRef.current) return;

    const currPos = currentVehicleLatLng;
    const currDist = progress * totalRouteKm;

    // Find cut point index
    let splitIdx = 0;
    for (let i = 0; i < cumDistances.length - 1; i++) {
      if (currDist >= cumDistances[i] && currDist <= cumDistances[i + 1]) {
        splitIdx = i;
        break;
      }
    }

    const completedCoords: [number, number][] = polylineCoords.slice(0, splitIdx + 1);
    completedCoords.push(currPos);

    const remainingCoords: [number, number][] = [currPos];
    remainingCoords.push(...polylineCoords.slice(splitIdx + 1));

    completedPolylineRef.current.setLatLngs(completedCoords);
    remainingPolylineRef.current.setLatLngs(remainingCoords);
  }, [currentVehicleLatLng, progress, polylineCoords, cumDistances, totalRouteKm]);

  // Render & Update Moving Vehicle Marker (Truck icon with driver name)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Vehicle marker is only shown for active trips (Scheduled or In Progress)
    const isTripActive = trip.status === 'Scheduled' || trip.status === 'In Progress';
    if (!isTripActive) {
      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
        vehicleMarkerRef.current = null;
      }
      return;
    }

    const driverName = trip.driver?.name || 'Driver';
    const vehicleIcon = L.divIcon({
      className: 'vehicle-leaflet-marker',
      html: `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <!-- Pulsing Beacon Ring -->
          <div style="
            position: absolute;
            top: 4px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.25);
            animation: pulse 1.8s infinite ease-in-out;
            pointer-events: none;
          "></div>

          <!-- Truck Icon Badge -->
          <div style="
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            z-index: 2;
          ">
            🚚
          </div>

          <!-- Driver Name Tag -->
          <div style="
            margin-top: 3px;
            background: #0f172a;
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 9999px;
            border: 1px solid rgba(255,255,255,0.4);
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            white-space: nowrap;
            letter-spacing: -0.2px;
          ">
            ${driverName}
          </div>
        </div>
      `,
      iconSize: [44, 52],
      iconAnchor: [22, 24],
      popupAnchor: [0, -26],
    });

    if (!vehicleMarkerRef.current) {
      const marker = L.marker(currentVehicleLatLng, { icon: vehicleIcon, zIndexOffset: 1000 });
      marker.bindPopup(`
        <div style="font-size: 12px; font-family: inherit;">
          <strong>${driverName} (Collection Van)</strong><br />
          Trip #${trip.tripNumber} • Speed: ${trip.vehiclePosition?.speedKmh || 30} km/h<br />
          <small style="color: #64748b;">Source: ${trackingMode === 'device' ? 'Live GPS Device' : 'Live Simulation'}</small>
        </div>
      `);
      marker.addTo(map);
      vehicleMarkerRef.current = marker;
    } else {
      vehicleMarkerRef.current.setLatLng(currentVehicleLatLng);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    }
  }, [currentVehicleLatLng, trip.driver?.name, trip.tripNumber, trip.status, trip.vehiclePosition?.speedKmh, trackingMode]);

  // Center on Vehicle Handler
  const handleCenterOnVehicle = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.panTo(currentVehicleLatLng, { animate: true, duration: 0.8 });
    }
  };

  // Next Pending Stop Lookup for Stop-Proximity (50m) and ETA Warning
  const nextTargetStop = useMemo(() => {
    return stops.find((s) => s.status === 'Pending' || s.status === 'En route');
  }, [stops]);

  // Check 50-meter proximity to next stop
  useEffect(() => {
    if (!nextTargetStop || trip.status !== 'In Progress') {
      setReachedStopPrompt(null);
      return;
    }
    const distToStopKm = haversineRoadDistanceKm(
      currentVehicleLatLng[0],
      currentVehicleLatLng[1],
      nextTargetStop.provider.lat,
      nextTargetStop.provider.lng
    ) / 1.35;

    // 50 meters = 0.05 km
    if (distToStopKm <= 0.05) {
      setReachedStopPrompt(nextTargetStop);
    } else {
      setReachedStopPrompt(null);
    }
  }, [currentVehicleLatLng, nextTargetStop, trip.status]);

  // SIMULATED TRACKING ENGINE
  useEffect(() => {
    if (trackingMode !== 'simulated' || isPaused || trip.status !== 'In Progress') return;

    // If waiting at a reached stop that hasn't been collected yet, pause movement at this stop
    if (reachedStopPrompt && reachedStopPrompt.status !== 'Collected') {
      return;
    }

    const baseSpeedKmh = 30; // base van speed in city
    const intervalMs = 150; // update 6.6 times per second for smooth movement
    const effectiveSpeedKmh = baseSpeedKmh * speedMultiplier;

    // Distance per tick in km: (speed / 3600s) * (interval / 1000s)
    const deltaKm = (effectiveSpeedKmh * intervalMs) / 3600000;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const nextDist = prev * totalRouteKm + deltaKm;
        const nextProg = Math.min(1.0, nextDist / totalRouteKm);
        const nextCoord = getCoordAtProgress(nextProg);

        // Update shared state
        onUpdateVehiclePosition?.(
          trip.id,
          {
            lat: nextCoord[0],
            lng: nextCoord[1],
            updatedAt: new Date().toISOString(),
            speedKmh: effectiveSpeedKmh,
            source: 'simulated',
          },
          nextProg
        );

        return nextProg;
      });
      setLastUpdatedText('Just now');
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    trackingMode,
    isPaused,
    trip.status,
    speedMultiplier,
    totalRouteKm,
    getCoordAtProgress,
    reachedStopPrompt,
    trip.id,
    onUpdateVehiclePosition,
  ]);

  // BroadcastChannel & Storage Event Synchronization for Multi-tab Live GPS
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.collectionId === trip.id && event.data?.vehiclePosition) {
          onUpdateVehiclePosition?.(
            trip.id,
            event.data.vehiclePosition,
            event.data.routeProgress
          );
          if (event.data.routeProgress !== undefined) {
            setProgress(event.data.routeProgress);
          }
          setLastUpdatedText('Just now');
        }
      };
    } catch {
      // BroadcastChannel unsupported fallback
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === `replate_pos_${trip.id}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          onUpdateVehiclePosition?.(trip.id, parsed.vehiclePosition, parsed.routeProgress);
          if (parsed.routeProgress !== undefined) {
            setProgress(parsed.routeProgress);
          }
          setLastUpdatedText('Just now');
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [trip.id, onUpdateVehiclePosition]);

  // DEVICE GPS MODE (Driver Mode)
  useEffect(() => {
    if (trackingMode !== 'device' || trip.status !== 'In Progress') return;

    if (!('geolocation' in navigator)) {
      setDeviceError('Geolocation is not supported by your browser. Falling back to simulated mode.');
      setTrackingMode('simulated');
      return;
    }

    setDeviceError(null);
    let broadcast: BroadcastChannel | null = null;
    try {
      broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      // ignore
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const speedKmh = Math.max(0, Math.round((pos.coords.speed || 0) * 3.6));
        const posObj: VehiclePosition = {
          lat,
          lng,
          updatedAt: new Date().toISOString(),
          speedKmh: speedKmh || 25,
          source: 'device',
        };

        // Estimate progress by finding closest point on polyline
        let bestDist = Infinity;
        let bestProg = progressRef.current;
        for (let i = 0; i < polylineCoords.length; i++) {
          const pt = polylineCoords[i];
          const d = haversineRoadDistanceKm(lat, lng, pt[0], pt[1]);
          if (d < bestDist) {
            bestDist = d;
            bestProg = cumDistances[i] / totalRouteKm;
          }
        }

        setProgress(bestProg);
        onUpdateVehiclePosition?.(trip.id, posObj, bestProg);

        // Broadcast to other tabs
        if (broadcast) {
          broadcast.postMessage({
            collectionId: trip.id,
            vehiclePosition: posObj,
            routeProgress: bestProg,
          });
        }
        try {
          localStorage.setItem(
            `replate_pos_${trip.id}`,
            JSON.stringify({ vehiclePosition: posObj, routeProgress: bestProg })
          );
        } catch {
          // ignore
        }

        setLastUpdatedText('Just now');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDeviceError(`GPS Error: ${err.message}. Falling back to simulated mode.`);
        setTrackingMode('simulated');
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (broadcast) broadcast.close();
    };
  }, [trackingMode, trip.status, trip.id, totalRouteKm, cumDistances, polylineCoords, onUpdateVehiclePosition]);

  // Remaining Distance, ETA to next stop and ETA to NGO calculations
  const remainingDistanceKm = Number((totalRouteKm * (1 - progress)).toFixed(1));
  const estimatedSpeedKmh = trackingMode === 'device' ? trip.vehiclePosition?.speedKmh || 25 : 30 * speedMultiplier;
  const minsToNgo = Math.max(1, Math.round((remainingDistanceKm / (estimatedSpeedKmh || 25)) * 60));

  const etaNgoDate = new Date(Date.now() + minsToNgo * 60 * 1000);
  const etaNgoFormatted = `${String(etaNgoDate.getHours()).padStart(2, '0')}:${String(etaNgoDate.getMinutes()).padStart(2, '0')}`;

  // Next stop ETA and deadline check
  const nextStopEtaInfo = useMemo(() => {
    if (!nextTargetStop) return null;
    const distToStopKm =
      haversineRoadDistanceKm(
        currentVehicleLatLng[0],
        currentVehicleLatLng[1],
        nextTargetStop.provider.lat,
        nextTargetStop.provider.lng
      ) / 1.35;
    const minsToStop = Math.max(1, Math.round((distToStopKm / (estimatedSpeedKmh || 25)) * 60));
    const etaStopDate = new Date(Date.now() + minsToStop * 60 * 1000);
    const etaStopFormatted = `${String(etaStopDate.getHours()).padStart(2, '0')}:${String(etaStopDate.getMinutes()).padStart(2, '0')}`;

    // Deadline check
    const isLate = etaStopDate.getTime() > nextTargetStop.donation.deadlineTimestamp;

    return {
      stop: nextTargetStop,
      distKm: Number(distToStopKm.toFixed(1)),
      minsToStop,
      etaStopFormatted,
      isLate,
      deadlineFormatted: nextTargetStop.donation.collectionDeadline,
    };
  }, [nextTargetStop, currentVehicleLatLng, estimatedSpeedKmh]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
      {/* Top Header Bar with Live Tracking Status & Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            🚚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Live Route & Vehicle Tracker
              </h4>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                {trackingMode === 'device' ? 'Driver GPS Active' : 'Simulated Movement'}
              </span>
              {trip.route.isEstimatedDistance && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                  Estimated path
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned to <strong>{trip.driver?.name}</strong> • Updated {lastUpdatedText}
            </p>
          </div>
        </div>

        {/* Tracking Mode Toggles & Speed Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Driver Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (trackingMode === 'device') {
                setTrackingMode('simulated');
              } else {
                setTrackingMode('device');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              trackingMode === 'device'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Driver Mode (GPS)</span>
          </button>

          {/* Simulation Speed & Pause if Simulated */}
          {trackingMode === 'simulated' && trip.status === 'In Progress' && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
              </button>
              {([1, 5, 20] as const).map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() => setSpeedMultiplier(mult)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    speedMultiplier === mult
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          )}

          {/* Center on Vehicle Button */}
          <button
            type="button"
            onClick={handleCenterOnVehicle}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-slate-500" />
            <span>Center on Van</span>
          </button>
        </div>
      </div>

      {/* Device Error Alert if any */}
      {deviceError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{deviceError}</span>
        </div>
      )}

      {/* Proximity Prompt (50m to stop) */}
      {reachedStopPrompt && reachedStopPrompt.status !== 'Collected' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-black">
              !
            </span>
            <div className="text-xs">
              <strong>Vehicle reached stop: {reachedStopPrompt.provider.name}</strong>
              <span className="block text-[11px] opacity-90">
                Van is within 50 m of the donor. Hand over OTP: <code>{reachedStopPrompt.donation.verificationOtp}</code>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reachedStopPrompt.status !== 'Arrived' && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStopProgress(trip.id, reachedStopPrompt.donationId, 'Arrived');
                }}
                className="px-3 py-1.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-900 cursor-pointer shadow-xs"
              >
                Mark as Arrived
              </button>
            )}
            <span className="text-[11px] font-semibold text-slate-900 bg-amber-400 px-2.5 py-1 rounded-lg">
              Waiting for Collection
            </span>
          </div>
        </div>
      )}

      {/* Map Display Container */}
      <div className="relative z-0 isolate h-[360px] sm:h-[400px] w-full">
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          role="region"
          aria-label="Interactive route map showing collection route stops and driver location"
          tabIndex={0}
        />

        {/* Legend Overlay on Map */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200 text-[11px] shadow-sm flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            NGO Hub
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <span className="w-4 h-1 bg-emerald-600 inline-block rounded"></span>
            Completed Road
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-semibold text-blue-700">
            <span className="w-4 h-1 border-t-2 border-dashed border-blue-600 inline-block"></span>
            Remaining Road
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            🚚 Van ({trip.driver?.name})
          </span>
        </div>
      </div>

      {/* Live Route Telemetry & ETA Dashboard below Map */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: Distance Remaining */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
            Distance Remaining
          </span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-base font-extrabold text-slate-900 font-mono">
              {remainingDistanceKm} km
            </strong>
            <span className="text-[11px] text-slate-500">of {trip.route.distanceKm} km</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Next Stop ETA */}
        <div className={`p-3 rounded-xl border space-y-0.5 ${
          nextStopEtaInfo?.isLate
            ? 'bg-rose-50 border-rose-200'
            : 'bg-white border border-slate-200/80'
        }`}>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
            Next Stop ETA
          </span>
          {nextStopEtaInfo ? (
            <div>
              <div className="flex items-baseline justify-between">
                <strong className={`text-base font-extrabold font-mono ${
                  nextStopEtaInfo.isLate ? 'text-rose-700' : 'text-slate-900'
                }`}>
                  ~{nextStopEtaInfo.minsToStop} min ({nextStopEtaInfo.etaStopFormatted})
                </strong>
                <span className="text-[11px] text-slate-500">{nextStopEtaInfo.distKm} km</span>
              </div>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                {nextStopEtaInfo.stop.provider.name}
              </p>
              {nextStopEtaInfo.isLate && (
                <p className="text-[10px] font-bold text-rose-700 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                  Late vs deadline ({nextStopEtaInfo.deadlineFormatted})!
                </p>
              )}
            </div>
          ) : (
            <div className="text-emerald-700 font-bold text-xs pt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              All stops collected! Heading to NGO.
            </div>
          )}
        </div>

        {/* Metric 3: Return to NGO Hub ETA */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
            Return to NGO Depot
          </span>
          <div className="flex items-baseline justify-between">
            <strong className="text-base font-extrabold text-slate-900 font-mono">
              ~{minsToNgo} min ({etaNgoFormatted})
            </strong>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Depot arrival for evening meal distribution
          </p>
        </div>

        {/* Metric 4: Van Speed & Driver */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
            Vehicle Status
          </span>
          <div className="flex items-baseline justify-between">
            <strong className="text-base font-extrabold text-emerald-700 font-mono">
              {trip.status}
            </strong>
            <span className="text-[11px] text-slate-600 font-semibold">
              {estimatedSpeedKmh} km/h
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Driver: {trip.driver?.name}
          </p>
        </div>
      </div>
    </div>
  );
};
