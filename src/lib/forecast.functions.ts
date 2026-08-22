import { createServerFn } from "@tanstack/react-start";

import { fetchForecast } from "./forecast.server";

export const getForecast = createServerFn({ method: "GET" }).handler(async () => fetchForecast());
