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
  /** City ids from src/data/brics.ts (`${COUNTRY}-${slug}`). */
  cities: string[];
}

export const CORRIDORS: Corridor[] = [
  {
    id: "in-igp",
    name: "Indo-Gangetic Plain Corridor",
    country_code: "IN",
    description: "Delhi NCR – Kanpur – Kolkata industrial and stubble-burning belt.",
    cities: ["IN-delhi", "IN-kanpur", "IN-kolkata"],
  },
  {
    id: "in-dmic",
    name: "Delhi–Mumbai Industrial Corridor",
    country_code: "IN",
    description: "Freight corridor linking NCR, Ahmedabad and Mumbai port clusters.",
    cities: ["IN-delhi", "IN-ahmedabad", "IN-mumbai"],
  },
  {
    id: "in-south",
    name: "Southern Peninsular Corridor",
    country_code: "IN",
    description: "Bengaluru – Mumbai coastal and inland urban belt.",
    cities: ["IN-bengaluru", "IN-mumbai"],
  },
  {
    id: "cn-jjj",
    name: "Beijing–Tianjin–Hebei (Jing-Jin-Ji)",
    country_code: "CN",
    description: "China's densest heavy-industry airshed, winter smog hotspot.",
    cities: ["CN-beijing", "CN-shijiazhuang", "CN-xi-an"],
  },
  {
    id: "cn-delta",
    name: "Yangtze–Pearl River Deltas",
    country_code: "CN",
    description: "Shanghai and Guangzhou manufacturing and port corridors.",
    cities: ["CN-shanghai", "CN-guangzhou"],
  },
  {
    id: "br-amazon",
    name: "Amazon Burning Arc",
    country_code: "BR",
    description: "Manaus – Porto Velho deforestation and biomass-burning frontier.",
    cities: ["BR-manaus", "BR-porto-velho"],
  },
  {
    id: "br-southeast",
    name: "Southeast Industrial Triangle",
    country_code: "BR",
    description: "São Paulo – Rio – Belo Horizonte manufacturing triangle.",
    cities: ["BR-sao-paulo", "BR-rio-de-janeiro", "BR-belo-horizonte"],
  },
  {
    id: "ru-urals",
    name: "Urals–Siberia Metallurgy Belt",
    country_code: "RU",
    description: "Chelyabinsk – Krasnoyarsk – Norilsk smelting corridor.",
    cities: ["RU-chelyabinsk", "RU-krasnoyarsk", "RU-norilsk"],
  },
  {
    id: "ru-west",
    name: "Moscow–Saint Petersburg Axis",
    country_code: "RU",
    description: "Russia's principal urban and logistics axis.",
    cities: ["RU-moscow", "RU-saint-petersburg"],
  },
  {
    id: "za-highveld",
    name: "Highveld Priority Area",
    country_code: "ZA",
    description: "Johannesburg – Pretoria – eMalahleni coal and power-station belt.",
    cities: ["ZA-johannesburg", "ZA-pretoria", "ZA-e-malahleni"],
  },
  {
    id: "za-coastal",
    name: "Coastal Port Corridor",
    country_code: "ZA",
    description: "Durban – Cape Town port and shipping corridor.",
    cities: ["ZA-durban", "ZA-cape-town"],
  },
];
