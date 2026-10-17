import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BASE_URL = 'https://maps.vietmap.vn/api';
/** Vietnam's 2-level admin units (ward -> province) in effect since 2025-07-01. */
const NEW_ADMIN_UNITS = '1';
const TIMEOUT_MS = 6000;

/** Boundary levels in VietMap responses. */
const PROVINCE = 0;
const WARD = 2;

interface VietmapBoundary {
  type: number;
  full_name: string;
}

interface VietmapResult {
  ref_id: string;
  name: string;
  address: string;
  display: string;
  lat?: number;
  lng?: number;
  boundaries?: VietmapBoundary[];
}

interface VietmapPlace {
  display: string;
  name: string;
  address: string;
  ward: string;
  city: string;
  lat: number;
  lng: number;
}

export interface GeoSuggestion {
  refId: string;
  name: string;
  address: string;
  display: string;
}

/** Shaped like the address fields of an Address / StoreLocation. */
export interface GeoPlace {
  addressLine: string;
  ward: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  display: string;
}

/**
 * VietMap Maps API (v4) proxy. Geocoding goes through the server so the API key
 * stays private; the browser only gets the separate tile key from `config()`.
 */
@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly apiKey?: string;
  private readonly tileKey?: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('VIETMAP_API_KEY') || undefined;
    this.tileKey = config.get<string>('VIETMAP_TILE_KEY') || undefined;
  }

  /** What the frontend needs; null = feature off (maps fall back to the default tiles). */
  config() {
    return { tileKey: this.tileKey ?? null, geocoding: !!this.apiKey };
  }

  async autocomplete(text: string, lat?: number, lng?: number): Promise<GeoSuggestion[]> {
    const results = await this.call<VietmapResult[]>('autocomplete/v4', {
      text,
      display_type: NEW_ADMIN_UNITS,
      ...(lat != null && lng != null ? { focus: `${lat},${lng}` } : {}),
    });
    return (results ?? []).map((r) => ({
      refId: r.ref_id,
      name: r.name,
      address: r.address,
      display: r.display,
    }));
  }

  async place(refId: string): Promise<GeoPlace> {
    const p = await this.call<VietmapPlace>('place/v4', { refid: refId });
    if (!p || p.lat == null || p.lng == null) throw new NotFoundException('Place not found');
    return {
      addressLine: p.address || p.name || p.display,
      ward: p.ward || null,
      city: p.city || null,
      latitude: p.lat,
      longitude: p.lng,
      display: p.display,
    };
  }

  async reverse(lat: number, lng: number): Promise<GeoPlace> {
    const [r] = (await this.call<VietmapResult[]>('reverse/v4', {
      lat: String(lat),
      lng: String(lng),
      display_type: NEW_ADMIN_UNITS,
    })) ?? [];
    if (!r) throw new NotFoundException('No address found here');
    const level = (type: number) => r.boundaries?.find((b) => b.type === type)?.full_name ?? null;
    return {
      addressLine: r.name,
      ward: level(WARD),
      city: level(PROVINCE),
      // Keep the pin where the user dropped it, not on the matched address.
      latitude: lat,
      longitude: lng,
      display: r.display,
    };
  }

  private async call<T>(path: string, params: Record<string, string>): Promise<T> {
    if (!this.apiKey) throw new ServiceUnavailableException('Address lookup is not configured');
    const url = `${BASE_URL}/${path}?${new URLSearchParams({ apikey: this.apiKey, ...params })}`;
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      this.logger.warn(`VietMap ${path} unreachable: ${(e as Error).message}`);
      throw new BadGatewayException('Address lookup is unavailable');
    }
    if (!res.ok) {
      // Never log `url`: it carries the API key.
      this.logger.warn(`VietMap ${path} -> ${res.status}`);
      throw new BadGatewayException('Address lookup is unavailable');
    }
    return (await res.json()) as T;
  }
}
