import { createServerFn } from "@tanstack/react-start";

import { fetchLiveReadings } from "./live.server";

export const getLiveReadings = createServerFn({ method: "GET" }).handler(async () =>
  fetchLiveReadings(),
);
