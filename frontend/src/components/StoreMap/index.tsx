'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { primaryLocation } from '@/lib/format';
import type { Store } from '@/store/types';

const pin = (bg: string, glyph: string) =>
  L.divIcon({
    className: '', iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -38],
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:3px solid #fff;box-shadow:0 3px 0 #4b1c14;display:grid;place-items:center"><span style="transform:rotate(45deg);color:#fcc12d;font:900 12px Lexend,sans-serif">${glyph}</span></div>`,
  });

const glyphOf = (s: Store) => (s.categories?.[0]?.name ?? s.name).slice(0, 2).toUpperCase().replace(/[<>&"]/g, '');

function FitBounds({ points, focus }: { points: [number, number][]; focus?: [number, number] }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (focus) map.setView(focus, 16);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, focus?.[0], focus?.[1], map]);
  return null;
}

function ClickToPick({ onPick }: { onPick?: (latlng: [number, number]) => void }) {
  useMapEvents({ click: (e) => onPick?.([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export interface StoreMapProps {
  stores: Store[];
  focusId?: number;
  /** Location being chosen for a new store (shown as a dark pin). */
  picked?: [number, number] | null;
  onPick?: (latlng: [number, number]) => void;
}

export default function StoreMap({ stores, focusId, picked, onPick }: StoreMapProps) {
  const located = useMemo(
    () => stores.map((s) => ({ s, loc: primaryLocation(s) })).filter((x): x is { s: Store; loc: NonNullable<ReturnType<typeof primaryLocation>> } => !!x.loc),
    [stores],
  );
  const points = located.map(({ loc }) => [Number(loc.latitude), Number(loc.longitude)] as [number, number]);
  const focusLoc = located.find((x) => x.s.id === focusId)?.loc;
  const focus = focusLoc ? ([Number(focusLoc.latitude), Number(focusLoc.longitude)] as [number, number]) : undefined;

  return (
    <MapContainer center={[10.788, 106.695]} zoom={14} scrollWheelZoom={false} style={{ height: 'clamp(320px,42vw,460px)', width: '100%' }}>
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxZoom={19} />
      <FitBounds points={points} focus={focus} />
      <ClickToPick onPick={onPick} />
      {located.map(({ s, loc }) => (
        <Marker key={s.id} position={[Number(loc.latitude), Number(loc.longitude)]} icon={pin('#992428', glyphOf(s))}>
          <Popup maxWidth={270}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 210, maxWidth: 250 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1d9563', letterSpacing: '.06em' }}>
                {[s.categories?.[0]?.name?.toUpperCase(), loc.district].filter(Boolean).join(' · ')}
              </span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#992428', lineHeight: 1.15 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: '#7a6a4a' }}>{loc.addressLine}</span>
              {s.description && <span style={{ fontSize: 13, lineHeight: 1.4 }}>“{s.description}”</span>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px dashed #e3dbb8', paddingTop: 8, marginTop: 2 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#2b1d2a', padding: '6px 10px' }}
                >
                  Chỉ đường ↗
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {picked && <Marker position={picked} icon={pin('#2b1d2a', '+')} />}
    </MapContainer>
  );
}
