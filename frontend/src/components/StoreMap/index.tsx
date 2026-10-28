import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_CENTER, primaryLocation } from '@/lib/format';
import MapTiles from './MapTiles';
import type { Store } from '@/redux/types';
import { PopupBody, PopupKicker, PopupName, PopupAddress, PopupQuote, PopupFoot, Directions, PopupAction } from './styles';

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

/** Brings a pin set from outside the map (e.g. an address search) into view; map clicks are already visible. */
function FollowPick({ picked }: { picked?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (picked && !map.getBounds().contains(picked)) map.setView(picked, 16);
  }, [picked, map]);
  return null;
}

function ClickToPick({ onPick }: { onPick?: (latlng: [number, number]) => void }) {
  useMapEvents({ click: (e) => onPick?.([e.latlng.lat, e.latlng.lng]) });
  return null;
}

/** The new store's pin; with `onPickedClick` it pops up like a saved store, opening on every drop. */
function PickedPin({ picked, onPickedClick }: { picked: [number, number]; onPickedClick?: () => void }) {
  const ref = useRef<L.Marker | null>(null);
  useEffect(() => {
    if (onPickedClick) ref.current?.openPopup();
  }, [picked[0], picked[1], onPickedClick]);
  return (
    <Marker ref={ref} position={picked} icon={pin('#2b1d2a', '+')} interactive={!!onPickedClick}>
      {onPickedClick && (
        <Popup maxWidth={270}>
          <PopupBody>
            <PopupKicker>VỊ TRÍ QUÁN MỚI</PopupKicker>
            <PopupName>Quán ruột của bạn ở đây?</PopupName>
            <PopupAddress>{picked[0].toFixed(5)}, {picked[1].toFixed(5)}</PopupAddress>
            <PopupQuote>Bấm chỗ khác trên bản đồ để dời ghim.</PopupQuote>
            <PopupFoot>
              <PopupAction type="button" onClick={onPickedClick}>Điền thông tin quán →</PopupAction>
            </PopupFoot>
          </PopupBody>
        </Popup>
      )}
    </Marker>
  );
}

export interface StoreMapProps {
  stores: Store[];
  focusId?: number;
  /** Location being chosen for a new store (shown as a dark pin). */
  picked?: [number, number] | null;
  onPick?: (latlng: [number, number]) => void;
  /** Click on the picked pin (e.g. jump to the new-store form). */
  onPickedClick?: () => void;
  /** CSS height of the map. */
  height?: string;
}

export default function StoreMap({ stores, focusId, picked, onPick, onPickedClick, height = 'clamp(320px,42vw,460px)' }: StoreMapProps) {
  const located = useMemo(
    () => stores.map((s) => ({ s, loc: primaryLocation(s) })).filter((x): x is { s: Store; loc: NonNullable<ReturnType<typeof primaryLocation>> } => !!x.loc),
    [stores],
  );
  const points = located.map(({ loc }) => [Number(loc.latitude), Number(loc.longitude)] as [number, number]);
  const focusLoc = located.find((x) => x.s.id === focusId)?.loc;
  const focus = focusLoc ? ([Number(focusLoc.latitude), Number(focusLoc.longitude)] as [number, number]) : undefined;

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={14} scrollWheelZoom={false} style={{ height, width: '100%' }}>
      <MapTiles />
      <FitBounds points={points} focus={focus} />
      <ClickToPick onPick={onPick} />
      <FollowPick picked={picked} />
      {located.map(({ s, loc }) => (
        <Marker key={s.id} position={[Number(loc.latitude), Number(loc.longitude)]} icon={pin('#992428', glyphOf(s))}>
          <Popup maxWidth={270}>
            <PopupBody>
              <PopupKicker>
                {[s.categories?.[0]?.name?.toUpperCase(), loc.ward ?? loc.district].filter(Boolean).join(' · ')}
              </PopupKicker>
              <PopupName>{s.name}</PopupName>
              <PopupAddress>{loc.addressLine}</PopupAddress>
              {s.description && <PopupQuote>“{s.description}”</PopupQuote>}
              <PopupFoot>
                <Directions
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  Chỉ đường ↗
                </Directions>
              </PopupFoot>
            </PopupBody>
          </Popup>
        </Marker>
      ))}
      {picked && <PickedPin picked={picked} onPickedClick={onPickedClick} />}
    </MapContainer>
  );
}
