import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppSelector } from '@/redux';
import { useGeoConfigQuery } from '@/redux/api';

/** VietMap vector style drawn by MapLibre inside Leaflet; tm = street map, dm = its dark variant. */
function VietmapLayer({ tileKey, dark }: { tileKey: string; dark: boolean }) {
  const map = useMap();
  useEffect(() => {
    // The plugin copies the style's attribution into Leaflet's control.
    const layer = maplibreGL({ style: `https://maps.vietmap.vn/maps/styles/${dark ? 'dm' : 'tm'}/style.json?apikey=${encodeURIComponent(tileKey)}` }).addTo(map);
    return () => { layer.remove(); };
  }, [map, tileKey, dark]);
  return null;
}

/** Base map for every Leaflet map: VietMap when VIETMAP_TILE_KEY is set, otherwise Esri street tiles. */
export default function MapTiles() {
  const { data, isLoading } = useGeoConfigQuery();
  const dark = useAppSelector((s) => s.ui.theme) === 'dark';
  if (isLoading) return null; // don't flash the fallback tiles first
  if (data?.tileKey) return <VietmapLayer tileKey={data.tileKey} dark={dark} />;
  return <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxZoom={19} />;
}
