import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NGO, Provider, FoodDonation, CollectionPlan, MealSlot, TripPlan } from '../types/surplusLink';
import { getMealSlotLabel } from '../utils/posAndPredictionUtils';

interface NgoMapProps {
  ngo: NGO;
  providers: Provider[];
  confirmedDonations: FoodDonation[];
  plan?: CollectionPlan | null;
  trips?: TripPlan[]; // kept for backwards compatibility
  activeTripNumber?: number | null;
  selectedDonationId?: string | null;
  activeMealSlot?: MealSlot;
  onSelectDonation?: (donationId: string) => void;
  isVisible?: boolean;
}

export const NgoMap: React.FC<NgoMapProps> = ({
  ngo,
  providers,
  confirmedDonations,
  plan,
  selectedDonationId,
  activeMealSlot = 'night',
  onSelectDonation,
  isVisible = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map (without route polylines - availability only)
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

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ngo.lat, ngo.lng]);

  // Invalidate map size when tab becomes visible or container resizes
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
  }, [isVisible]);

  // ResizeObserver to invalidate map size whenever container size changes
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

  // Update Markers: Availability Only (no route lines, no numbered stops)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. Add NGO Base Hub Marker at Center
    const ngoLatLng: [number, number] = [ngo.lat, ngo.lng];
    bounds.extend(ngoLatLng);

    const ngoIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background-color: #059669;
          color: white;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
        ">
          <span>NGO</span>
          <span style="font-size: 8px; font-weight: 600; opacity: 0.9;">HUB</span>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -22],
    });

    const ngoMarker = L.marker(ngoLatLng, { icon: ngoIcon });
    const ngoPopupHtml = `
      <div style="font-family: inherit; font-size: 12px; min-width: 220px; padding: 2px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="background: #dcfce7; color: #166534; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
            Center Hub & Depot
          </span>
        </div>
        <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${ngo.name}</h4>
        <p style="margin: 4px 0; color: #64748b; font-size: 11px;">${ngo.address}</p>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5;">
          <div><strong>Service Radius:</strong> ${ngo.serviceRadiusKm ?? 5.0} km</div>
          <div><strong>Vehicle:</strong> ${ngo.vehicle.model}</div>
          <div><strong>Capacity:</strong> ${ngo.vanCapacityPortions} portions</div>
          <div><strong>Driver:</strong> ${ngo.vehicle.driverName}</div>
        </div>
      </div>
    `;
    ngoMarker.bindPopup(ngoPopupHtml);
    markersGroup.addLayer(ngoMarker);

    // 2. Add Service Radius Circle around NGO
    const serviceRadiusKm = ngo.serviceRadiusKm ?? 5.0;
    const radiusMeters = serviceRadiusKm * 1000;
    const radiusCircle = L.circle(ngoLatLng, {
      radius: radiusMeters,
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '6, 6',
    });
    radiusCircle.bindTooltip(`NGO Service Radius: ${serviceRadiusKm} km`, { sticky: true });
    markersGroup.addLayer(radiusCircle);
    bounds.extend(radiusCircle.getBounds());

    // 3. Lookups for Provider State: Available (green), On Hold (amber), Excluded (red), Out of Range (grey)
    const providerDonationMap = new Map<string, FoodDonation>();
    confirmedDonations.forEach((d) => {
      providerDonationMap.set(d.providerId, d);
    });

    // Excluded donations map
    const excludedDonationsMap = new Map<string, string>();
    if (plan?.excludedDonations) {
      plan.excludedDonations.forEach((rec) => {
        excludedDonationsMap.set(rec.donationId, rec.detail || rec.reasonLabel || 'Excluded from routing');
      });
    }

    // On-hold donation IDs map
    const onHoldDonationIds = new Set<string>();
    if (plan?.onHoldTrips) {
      plan.onHoldTrips.forEach((t) => {
        t.stops.forEach((s) => onHoldDonationIds.add(s.donationId));
      });
    }

    // 4. Render Provider Markers
    providers.forEach((provider) => {
      const pLatLng: [number, number] = [provider.lat, provider.lng];
      bounds.extend(pLatLng);

      const isOutOfRange = (provider.distanceKmFromNgo ?? 0) > serviceRadiusKm;
      const donation = providerDonationMap.get(provider.id);
      const isSelected = donation && selectedDonationId === donation.id;

      if (isOutOfRange) {
        // STATE 1: OUT OF RANGE (Grey)
        const outOfRangeIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="
              background-color: #64748b;
              color: #f8fafc;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 2px solid #cbd5e1;
              box-shadow: 0 2px 6px rgba(0,0,0,0.18);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 9px;
              cursor: pointer;
              opacity: 0.75;
            ">
              <span>OUT</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const marker = L.marker(pLatLng, { icon: outOfRangeIcon });
        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; min-width: 240px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
              <span style="background: #f1f5f9; color: #475569; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                Out of range
              </span>
              <span style="font-weight: 700; color: #e11d48; font-size: 11px;">
                ${provider.distanceKmFromNgo} km away
              </span>
            </div>
            <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${provider.name}</h4>
            <p style="margin: 4px 0 6px 0; color: #e11d48; font-weight: 600; font-size: 11px;">
              Excluded because it is outside this NGO's service radius.
            </p>
            <div style="padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5; color: #475569;">
              <div><strong>Type:</strong> ${provider.type.replace('_', ' ')}</div>
              <div><strong>Distance from NGO:</strong> ${provider.distanceKmFromNgo} km (Service radius: ${serviceRadiusKm} km)</div>
              ${donation ? `<div><strong>Offered Surplus:</strong> ${donation.portions} portions (${donation.foodItem})</div>` : ''}
              <div style="color: #64748b; font-style: italic; margin-top: 4px;">
                Not planned in automated collection trips.
              </div>
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml);
        markersGroup.addLayer(marker);
      } else if (donation) {
        // Provider has an active donation in this meal slot.
        const isExcluded =
          Boolean(donation.exclusionRecord) ||
          excludedDonationsMap.has(donation.id);
        const exclusionReason =
          donation.exclusionRecord?.detail ||
          donation.exclusionRecord?.reasonLabel ||
          excludedDonationsMap.get(donation.id) ||
          'Excluded due to safety or logistics rules';

        const isOnHold = onHoldDonationIds.has(donation.id);

        let markerColor = '#10b981'; // Green: Available
        let stateLabel = 'Available';
        let badgeBg = '#dcfce7';
        let badgeTextColor = '#166534';

        if (isExcluded) {
          markerColor = '#ef4444'; // Red: Excluded
          stateLabel = 'Excluded';
          badgeBg = '#fee2e2';
          badgeTextColor = '#991b1b';
        } else if (isOnHold) {
          markerColor = '#f59e0b'; // Amber: On Hold
          stateLabel = 'On Hold';
          badgeBg = '#fef3c7';
          badgeTextColor = '#92400e';
        }

        const providerIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="
              background-color: ${isSelected ? '#0f172a' : markerColor};
              color: white;
              width: 36px;
              height: 36px;
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
              <span style="font-size: 12px; font-family: monospace; font-weight: 800; line-height: 1;">${donation.portions}</span>
              <span style="font-size: 8px; text-transform: uppercase; line-height: 1; opacity: 0.9;">pts</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

        const marker = L.marker(pLatLng, { icon: providerIcon });
        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; min-width: 230px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
              <span style="background: ${badgeBg}; color: ${badgeTextColor}; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                ${stateLabel}
              </span>
              <span style="font-weight: 800; font-family: monospace; color: ${markerColor}; font-size: 13px;">
                ${donation.portions} Portions
              </span>
            </div>
            <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${provider.name}</h4>
            <p style="margin: 2px 0 6px 0; color: #059669; font-weight: 600; font-size: 11px;">"${donation.foodItem}"</p>
            <div style="padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5; color: #475569;">
              <div><strong>Meal:</strong> ${getMealSlotLabel(donation.mealSlot || activeMealSlot)}</div>
              <div><strong>Portions:</strong> ${donation.portions} portions</div>
              <div><strong>Deadline:</strong> <span style="color: #c2410c; font-weight: 700;">${donation.collectionDeadline}</span></div>
              ${
                isExcluded
                  ? `<div style="margin-top: 4px; color: #dc2626; font-weight: 600;"><strong>Reason:</strong> ${exclusionReason}</div>`
                  : isOnHold
                  ? `<div style="margin-top: 4px; color: #d97706; font-weight: 600;"><strong>Notice:</strong> Sub-threshold volume (&lt;20 meals). On hold for additional donors.</div>`
                  : `<div style="margin-top: 4px; color: #059669; font-weight: 600;">Ready for automated dispatch.</div>`
              }
              <div style="margin-top: 4px; font-size: 10px; color: #64748b;">
                Distance from NGO: ${provider.distanceKmFromNgo} km
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        if (onSelectDonation) {
          marker.on('click', () => onSelectDonation(donation.id));
        }
        markersGroup.addLayer(marker);
      } else {
        // In-range provider without active donation tonight (idle eligible node)
        const idleIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="
              background-color: #10b981;
              color: white;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.18);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 8px;
              cursor: pointer;
              opacity: 0.85;
            ">
              <span>●</span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -11],
        });

        const marker = L.marker(pLatLng, { icon: idleIcon });
        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; min-width: 200px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
              <span style="background: #dcfce7; color: #166534; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                Eligible Provider
              </span>
            </div>
            <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${provider.name}</h4>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5; color: #475569;">
              <div><strong>Type:</strong> ${provider.type.replace('_', ' ')}</div>
              <div><strong>Distance from NGO:</strong> ${provider.distanceKmFromNgo} km</div>
              <div style="color: #64748b; font-style: italic; margin-top: 3px;">Within service radius • No surplus logged for this meal</div>
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml);
        markersGroup.addLayer(marker);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [ngo, providers, confirmedDonations, plan, selectedDonationId, activeMealSlot, onSelectDonation]);

  return (
    <div className="relative z-0 isolate w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px]" />

      {/* Map Legend Overlay: Availability Only */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs shadow-sm flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 font-bold text-slate-800">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
          NGO Hub ({ngo.serviceRadiusKm ?? 5.0} km)
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          Available
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5 font-semibold text-amber-800">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          On Hold
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5 font-semibold text-rose-800">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
          Excluded
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
          <span className="w-3 h-3 rounded-full bg-slate-500 inline-block"></span>
          Out of Range
        </span>
      </div>
    </div>
  );
};
