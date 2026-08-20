/**
 * BRICS AirShield — demo environmental dataset.
 *
 * IMPORTANT: These are SIMULATED / DEMO values with realistic magnitudes for
 * each city (based on publicly reported typical ranges). They are NOT live
 * government sensor readings. Live weather can be layered on top via the
 * free Open-Meteo API (see src/lib/weather.functions.ts).
 */

export type CountryCode = "IN" | "BR" | "RU" | "CN" | "ZA";

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  region: string;
}

export interface CityReading {
  id: string;
  country_code: CountryCode;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  pm25: number;
  pm10: number;
  aqi: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  source: "demo" | "live";
}

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India", flag: "🇮🇳", region: "South Asia" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", region: "South America" },
  { code: "RU", name: "Russia", flag: "🇷🇺", region: "Eurasia" },
  { code: "CN", name: "China", flag: "🇨🇳", region: "East Asia" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", region: "Southern Africa" },
];

type Seed = [
  city: string,
  region: string,
  lat: number,
  lon: number,
  pm25: number,
  pm10: number,
  temp: number,
  hum: number,
  wind: number,
  dir: number,
  pressure: number,
];

const SEEDS: Record<CountryCode, Seed[]> = {
  IN: [
    ["Delhi", "National Capital Region", 28.6139, 77.209, 168, 284, 34, 42, 2.1, 310, 1004],
    ["Kanpur", "Uttar Pradesh", 26.4499, 80.3319, 142, 240, 35, 45, 2.6, 295, 1005],
    ["Mumbai", "Maharashtra", 19.076, 72.8777, 61, 108, 31, 74, 5.4, 250, 1008],
    ["Kolkata", "West Bengal", 22.5726, 88.3639, 96, 158, 32, 68, 3.2, 180, 1006],
    ["Bengaluru", "Karnataka", 12.9716, 77.5946, 38, 72, 27, 60, 4.6, 240, 1010],
    ["Ahmedabad", "Gujarat", 23.0225, 72.5714, 88, 150, 36, 38, 3.9, 285, 1006],
  ],
  BR: [
    ["São Paulo", "Southeast", -23.5505, -46.6333, 34, 58, 24, 66, 3.1, 130, 1013],
    ["Rio de Janeiro", "Southeast", -22.9068, -43.1729, 26, 46, 28, 72, 4.2, 110, 1012],
    ["Manaus", "North (Amazon)", -3.119, -60.0217, 58, 92, 31, 80, 1.8, 90, 1009],
    ["Porto Velho", "North (Amazon)", -8.7612, -63.902, 74, 116, 33, 71, 1.5, 75, 1009],
    ["Belo Horizonte", "Southeast", -19.9167, -43.9345, 29, 52, 26, 58, 2.9, 120, 1014],
  ],
  RU: [
    ["Moscow", "Central", 55.7558, 37.6173, 21, 38, 9, 71, 4.1, 220, 1016],
    ["Krasnoyarsk", "Siberia", 56.0153, 92.8932, 64, 98, 4, 66, 1.9, 200, 1018],
    ["Norilsk", "Siberia (Arctic)", 69.3558, 88.1893, 82, 121, -8, 78, 5.2, 300, 1020],
    ["Chelyabinsk", "Urals", 55.1644, 61.4368, 47, 79, 6, 68, 3.4, 260, 1017],
    ["Saint Petersburg", "Northwest", 59.9311, 30.3609, 18, 33, 7, 80, 5.0, 240, 1013],
  ],
  CN: [
    ["Beijing", "North China", 39.9042, 116.4074, 92, 152, 18, 44, 3.0, 320, 1011],
    ["Shanghai", "East China", 31.2304, 121.4737, 47, 82, 22, 68, 4.4, 130, 1012],
    ["Xi'an", "Northwest", 34.3416, 108.9398, 104, 168, 19, 52, 2.2, 290, 1010],
    ["Shijiazhuang", "North China", 38.0428, 114.5149, 118, 189, 20, 47, 2.4, 305, 1010],
    ["Guangzhou", "South China", 23.1291, 113.2644, 41, 70, 27, 74, 3.6, 150, 1011],
  ],
  ZA: [
    ["Johannesburg", "Gauteng", -26.2041, 28.0473, 44, 76, 22, 45, 3.8, 20, 1015],
    ["eMalahleni", "Mpumalanga", -25.8776, 29.2317, 78, 128, 23, 40, 2.3, 40, 1014],
    ["Cape Town", "Western Cape", -33.9249, 18.4241, 22, 41, 20, 66, 6.5, 190, 1016],
    ["Durban", "KwaZulu-Natal", -29.8587, 31.0218, 31, 55, 24, 73, 4.9, 100, 1015],
    ["Pretoria", "Gauteng", -25.7479, 28.2293, 39, 68, 24, 43, 3.3, 30, 1015],
  ],
};

/** US EPA-style AQI breakpoints for PM2.5 (24h). */
export function aqiFromPm25(pm25: number): number {
  const bp: Array<[number, number, number, number]> = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ];
  for (const [cl, ch, il, ih] of bp) {
    if (pm25 <= ch) return Math.round(((ih - il) / (ch - cl)) * (pm25 - cl) + il);
  }
  return 500;
}

/** Deterministic pseudo-random in [-1, 1] so SSR and client agree. */
function jitter(key: string, bucket: number): number {
  let h = 2166136261;
  const s = `${key}:${bucket}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 2000) / 1000 - 1;
}

/**
 * Returns the demo readings. Values drift slowly over time (hourly bucket) so
 * the prototype looks alive without any paid streaming infrastructure.
 */
export function getReadings(now = Date.now()): CityReading[] {
  const bucket = Math.floor(now / (60 * 60 * 1000));
  const out: CityReading[] = [];
  for (const country of COUNTRIES) {
    for (const s of SEEDS[country.code]) {
      const [city, region, lat, lon, pm25, pm10, temp, hum, wind, dir, pressure] = s;
      const j = (k: string, amp: number) => jitter(`${city}${k}`, bucket) * amp;
      const p25 = Math.max(3, Math.round((pm25 + j("pm25", pm25 * 0.18)) * 10) / 10);
      const p10 = Math.max(5, Math.round((pm10 + j("pm10", pm10 * 0.16)) * 10) / 10);
      out.push({
        id: `${country.code}-${city.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        country_code: country.code,
        country: country.name,
        region,
        city,
        latitude: lat,
        longitude: lon,
        timestamp: new Date(bucket * 3600_000).toISOString(),
        pm25: p25,
        pm10: p10,
        aqi: aqiFromPm25(p25),
        temperature: Math.round((temp + j("t", 3)) * 10) / 10,
        humidity: Math.min(99, Math.max(10, Math.round(hum + j("h", 8)))),
        wind_speed: Math.max(0.3, Math.round((wind + j("w", 1.4)) * 10) / 10),
        wind_direction: Math.round((dir + j("d", 30) + 360) % 360),
        pressure: Math.round(pressure + j("p", 4)),
        source: "demo",
      });
    }
  }
  return out;
}

export function getReadingById(id: string, now = Date.now()) {
  return getReadings(now).find((r) => r.id === id);
}
