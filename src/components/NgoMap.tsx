import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NGO, Provider, FoodDonation, TripPlan } from '../types/surplusLink';

interface NgoMapProps {
  ngo: NGO;
  providers: Provider[];
  confirmedDonations: FoodDonation[];
  trips?: TripPlan[];
  activeTripNumber?: number | null;
  selectedDonationId?: string | null;
  onSelectDonation?: (donationId: string) => void;
  isVisible?: boolean;
}

const TRIP_COLORS = ['#ea580c', '#2563eb', '#7c3aed', '#059669'];

export const NgoMap: React.FC<NgoMapProps> = ({
  ngo,
  providers,
  confirmedDonations,
  trips = [],
  activeTripNumber,
  selectedDonationId,
  onSelectDonation,
  isVisible = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [9.9367, 78.128],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      polylinesLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when tab becomes visible or container resizes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isVisible) {
      // Invalidate immediately and after a short tick
      map.invalidateSize();
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // ResizeObserver to invalidate map size whenever the container size changes
  useEffect(() => {
    const container = mapContainerRef.current;
    const map = mapInstanceRef.current;
    if (!container || !map) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update Markers, Polylines & Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const polylinesGroup = polylinesLayerRef.current;
    if (!map || !markersGroup || !polylinesGroup) return;

    markersGroup.clearLayers();
    polylinesGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Add NGO Base Marker
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
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
        ">
          NGO
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20],
    });

    const ngoMarker = L.marker(ngoLatLng, { icon: ngoIcon });
    const ngoPopupHtml = `
      <div style="font-family: inherit; font-size: 12px; min-width: 210px; padding: 2px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="background: #ffedd5; color: #9a3412; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
            Base Depot
          </span>
        </div>
        <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${ngo.name}</h4>
        <p style="margin: 4px 0; color: #64748b; font-size: 11px;">${ngo.address}</p>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5;">
          <div><strong>Vehicle:</strong> ${ngo.vehicle.model}</div>
          <div><strong>Capacity:</strong> ${ngo.vanCapacityPortions} portions</div>
          <div><strong>Driver:</strong> ${ngo.vehicle.driverName}</div>
        </div>
      </div>
    `;
    ngoMarker.bindPopup(ngoPopupHtml);
    markersGroup.addLayer(ngoMarker);

    // 2. Map of stops in trips for quick lookup
    const tripStopMap = new Map<
      string,
      { stopOrder: number; tripNumber: number; arrivalMins: number; isDeadlineMet: boolean }
    >();
    trips.forEach((t) => {
      t.stops.forEach((s) => {
        tripStopMap.set(s.donationId, {
          stopOrder: s.stopOrder,
          tripNumber: t.tripNumber,
          arrivalMins: s.estimatedArrivalMinutesFromStart,
          isDeadlineMet: s.isDeadlineMet,
        });
      });
    });

    // 3. Draw Polylines for each Trip
    trips.forEach((trip, idx) => {
      const color = TRIP_COLORS[idx % TRIP_COLORS.length];
      const isTripFocused = !activeTripNumber || activeTripNumber === trip.tripNumber;
      const opacity = isTripFocused ? 0.9 : 0.35;
      const weight = isTripFocused ? 4.5 : 2.5;

      if (trip.polylineCoordinates && trip.polylineCoordinates.length > 0) {
        trip.polylineCoordinates.forEach((c) => bounds.extend(c));
        const polyline = L.polyline(trip.polylineCoordinates, {
          color,
          weight,
          opacity,
          dashArray: trip.isEstimatedDistance ? '6, 8' : undefined,
          lineJoin: 'round',
        });
        polyline.bindTooltip(
          `Trip ${trip.tripNumber}: ${trip.totalPortions} portions • ${trip.distanceKm} km ${
            trip.isEstimatedDistance ? '(est)' : ''
          }`,
          { sticky: true }
        );
        polylinesGroup.addLayer(polyline);
      }
    });

    // 4. Add Confirmed Provider Markers
    const providerMap = new Map(providers.map((p) => [p.id, p]));
    confirmedDonations.forEach((donation) => {
      const provider = providerMap.get(donation.providerId);
      if (!provider) return;

      const pLatLng: [number, number] = [provider.lat, provider.lng];
      bounds.extend(pLatLng);

      const tripInfo = tripStopMap.get(donation.id);
      const isSelected = selectedDonationId === donation.id;
      const markerColor = tripInfo ? TRIP_COLORS[(tripInfo.tripNumber - 1) % TRIP_COLORS.length] : '#059669';

      const providerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${isSelected ? '#0f172a' : markerColor};
            color: white;
            width: ${tripInfo ? '38px' : '34px'};
            height: ${tripInfo ? '38px' : '34px'};
            border-radius: 50%;
            border: ${isSelected ? '3px solid #fbbf24' : '3px solid white'};
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${
              tripInfo
                ? `<span style="font-size: 13px; font-family: monospace; font-weight: 800; line-height: 1;">#${tripInfo.stopOrder}</span>
                   <span style="font-size: 8px; line-height: 1; opacity: 0.9;">${donation.portions}p</span>`
                : `<span style="font-size: 12px; font-family: monospace; line-height: 1;">${donation.portions}</span>
                   <span style="font-size: 8px; text-transform: uppercase; line-height: 1; opacity: 0.85;">pts</span>`
            }
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(pLatLng, { icon: providerIcon });
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 230px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <span style="background: #e2e8f0; color: #1e293b; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${tripInfo ? `Trip ${tripInfo.tripNumber} • Stop #${tripInfo.stopOrder}` : provider.type.replace('_', ' ')}
            </span>
            <span style="font-weight: 800; font-family: monospace; color: #059669; font-size: 13px;">
              ${donation.portions} Portions
            </span>
          </div>
          <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${provider.name}</h4>
          <p style="margin: 2px 0 6px 0; color: #059669; font-weight: 600; font-size: 11px;">"${donation.foodItem}"</p>
          <div style="padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5; color: #475569;">
            <div><strong>Deadline:</strong> <span style="color: #c2410c; font-weight: 700;">${donation.collectionDeadline}</span></div>
            ${
              tripInfo
                ? `<div><strong>Status:</strong> ${
                    tripInfo.isDeadlineMet
                      ? '<span style="color: #059669; font-weight: 700;">✓ Deadline Met</span>'
                      : '<span style="color: #dc2626; font-weight: 700;">⚠ Deadline Risk</span>'
                  } (Est. +${tripInfo.arrivalMins}m)</div>`
                : ''
            }
            <div><strong>Handover OTP:</strong> <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-weight: 700;">${donation.verificationOtp}</code></div>
            <div><strong>Distance from Campus:</strong> ${provider.distanceKmFromCollege} km</div>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      if (onSelectDonation) {
        marker.on('click', () => onSelectDonation(donation.id));
      }
      markersGroup.addLayer(marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [ngo, providers, confirmedDonations, trips, activeTripNumber, selectedDonationId, onSelectDonation]);

  return (
    <div className="relative z-0 isolate w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px]" />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-sm flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
          NGO Base (3 km)
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="w-3 h-3 rounded-full bg-emerald-700 inline-block"></span>
          Donors ({confirmedDonations.length})
        </span>
        {trips.length > 0 && (
          <>
            <span className="text-slate-300">|</span>
            {trips.map((t, idx) => (
              <span key={t.tripNumber} className="flex items-center gap-1 font-semibold text-slate-800">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: TRIP_COLORS[idx % TRIP_COLORS.length] }}
                ></span>
                Trip {t.tripNumber} ({t.totalPortions}p)
              </span>
            ))}
            {trips.some((t) => t.isEstimatedDistance) && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                estimated route
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
