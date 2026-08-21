/**
 * Economic corridors — groups of cities that share airsheds and freight/industrial
 * traffic. Forecast spikes are aggregated per corridor so authorities on both
 * ends of a corridor can coordinate interventions.
 */

import type { CountryCode } from "@/data/brics";

export interface Corridor {
  id: string;
  name: string;
  country_code: CountryCode;
  description: string;
  /** City names as they appear in src/data/brics.ts. */
  cities: string[];
}

export const CORRIDORS: Corridor[] = [
  {
    id: "in-igp",
    name: "Indo-Gangetic Plain Corridor",
    country_code: "IN",
    description: "Delhi NCR – Kanpur – Kolkata industrial and stubble-burning belt.",
    cities: ["Delhi", "Kanpur", "Kolkata"],
  },
  {
    id: "in-dmic",
    name: "Delhi–Mumbai Industrial Corridor",
    country_code: "IN",
    description: "Freight corridor linking NCR, Ahmedabad and Mumbai port clusters.",
    cities: ["Delhi", "Ahmedabad", "Mumbai"],
  },
  {
    id: "in-south",
    name: "Southern Peninsular Corridor",
    country_code: "IN",
    description: "Bengaluru – Mumbai coastal and inland urban belt.",
    cities: ["Bengaluru", "Mumbai"],
  },
  {
    id: "cn-jjj",
    name: "Beijing–Tianjin–Hebei (Jing-Jin-Ji)",
    country_code: "CN",
    description: "China's densest heavy-industry airshed, winter smog hotspot.",
    cities: ["Beijing", "Shijiazhuang", "Xi'an"],
  },
  {
    id: "cn-delta",
    name: "Yangtze–Pearl River Deltas",
    country_code: "CN",
    description: "Shanghai and Guangzhou manufacturing and port corridors.",
    cities: ["Shanghai", "Guangzhou"],
  },
  {
    id: "br-amazon",
    name: "Amazon Burning Arc",
    country_code: "BR",
    description: "Manaus – Porto Velho deforestation and biomass-burning frontier.",
    cities: ["Manaus", "Porto Velho"],
  },
  {
    id: "br-southeast",
    name: "Southeast Industrial Triangle",
    country_code: "BR",
    description: "São Paulo – Rio – Belo Horizonte manufacturing triangle.",
    cities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte"],
  },
  {
    id: "ru-urals",
    name: "Urals–Siberia Metallurgy Belt",
    country_code: "RU",
    description: "Chelyabinsk – Krasnoyarsk – Norilsk smelting corridor.",
    cities: ["Chelyabinsk", "Krasnoyarsk", "Norilsk"],
  },
  {
    id: "ru-west",
    name: "Moscow–Saint Petersburg Axis",
    country_code: "RU",
    description: "Russia's principal urban and logistics axis.",
    cities: ["Moscow", "Saint Petersburg"],
  },
  {
    id: "za-highveld",
    name: "Highveld Priority Area",
    country_code: "ZA",
    description: "Johannesburg – Pretoria – eMalahleni coal and power-station belt.",
    cities: ["Johannesburg", "Pretoria", "eMalahleni"],
  },
  {
    id: "za-coastal",
    name: "Coastal Port Corridor",
    country_code: "ZA",
    description: "Durban – Cape Town port and shipping corridor.",
    cities: ["Durban", "Cape Town"],
  },
];
