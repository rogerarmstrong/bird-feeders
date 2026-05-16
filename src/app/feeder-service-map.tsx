"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const SERVICE_HOURS = 24;
const FILL_HOURS = 72;
const MIN_FILL_PERCENT = 25;
const TILE_SIZE = 256;
const MAP_TILE_RADIUS = 2;
const MAP_MIN_ZOOM = 11;
const MAP_MAX_ZOOM = 17;
const MAP_FIT_WIDTH = 720;
const MAP_FIT_HEIGHT = 260;

type MapFeeder = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lastCleanedAt: string;
  cleanStatus: string;
  fillStatus: string;
  assignedUser: string;
  latestMeasurement: {
    fillPercent: number;
    measuredAt: string;
  } | null;
};

type FeederServiceMapProps = {
  feeders: MapFeeder[];
};

function isRecentlyServiced(feeder: MapFeeder) {
  const cleanedRecently =
    Date.now() - new Date(feeder.lastCleanedAt).getTime() <= SERVICE_HOURS * 60 * 60 * 1000;
  const filledRecently = feeder.latestMeasurement
    ? Date.now() - new Date(feeder.latestMeasurement.measuredAt).getTime() <=
        FILL_HOURS * 60 * 60 * 1000 && feeder.latestMeasurement.fillPercent >= MIN_FILL_PERCENT
    : false;

  return (
    feeder.cleanStatus === "CLEAN" &&
    feeder.fillStatus === "FILLED" &&
    cleanedRecently &&
    filledRecently
  );
}

function latLngToWorldPoint(latitude: number, longitude: number, zoom: number) {
  const scale = 2 ** zoom;
  const latRad = (latitude * Math.PI) / 180;

  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      scale
  };
}

function chooseMapZoom(bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  for (let zoom = MAP_MAX_ZOOM; zoom >= MAP_MIN_ZOOM; zoom -= 1) {
    const northWest = latLngToWorldPoint(bounds.maxLat, bounds.minLng, zoom);
    const southEast = latLngToWorldPoint(bounds.minLat, bounds.maxLng, zoom);
    const widthPx = Math.abs(southEast.x - northWest.x) * TILE_SIZE;
    const heightPx = Math.abs(southEast.y - northWest.y) * TILE_SIZE;

    if (widthPx <= MAP_FIT_WIDTH && heightPx <= MAP_FIT_HEIGHT) {
      return zoom;
    }
  }

  return MAP_MIN_ZOOM;
}

function markerPosition(latitude: number, longitude: number, center: { x: number; y: number }, zoom: number) {
  const point = latLngToWorldPoint(latitude, longitude, zoom);

  return {
    left: `calc(50% + ${(point.x - center.x) * TILE_SIZE}px)`,
    top: `calc(50% + ${(point.y - center.y) * TILE_SIZE}px)`
  };
}

function getMapTiles(center: { x: number; y: number }, zoom: number) {
  const centerTileX = Math.floor(center.x);
  const centerTileY = Math.floor(center.y);
  const tileCount = 2 ** zoom;
  const tiles = [];

  for (let yOffset = -MAP_TILE_RADIUS; yOffset <= MAP_TILE_RADIUS; yOffset += 1) {
    for (let xOffset = -MAP_TILE_RADIUS; xOffset <= MAP_TILE_RADIUS; xOffset += 1) {
      const tileX = centerTileX + xOffset;
      const tileY = centerTileY + yOffset;
      const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount;

      tiles.push({
        key: `${zoom}-${tileX}-${tileY}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
        style: {
          left: `calc(50% + ${(tileX + 0.5 - center.x) * TILE_SIZE}px)`,
          top: `calc(50% + ${(tileY + 0.5 - center.y) * TILE_SIZE}px)`
        }
      });
    }
  }

  return tiles;
}

function getMapBounds(feeders: MapFeeder[]) {
  const latitudes = feeders.map((feeder) => feeder.latitude);
  const longitudes = feeders.map((feeder) => feeder.longitude);
  const rawBounds = {
    minLat: latitudes.length > 0 ? Math.min(...latitudes) : 0,
    maxLat: latitudes.length > 0 ? Math.max(...latitudes) : 1,
    minLng: longitudes.length > 0 ? Math.min(...longitudes) : 0,
    maxLng: longitudes.length > 0 ? Math.max(...longitudes) : 1
  };
  const latPadding = Math.max((rawBounds.maxLat - rawBounds.minLat) * 0.04, 0.0002);
  const lngPadding = Math.max((rawBounds.maxLng - rawBounds.minLng) * 0.04, 0.0002);

  return {
    minLat: rawBounds.minLat - latPadding,
    maxLat: rawBounds.maxLat + latPadding,
    minLng: rawBounds.minLng - lngPadding,
    maxLng: rawBounds.maxLng + lngPadding
  };
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function FeederServiceMap({ feeders }: FeederServiceMapProps) {
  const bounds = useMemo(() => getMapBounds(feeders), [feeders]);
  const fittedZoom = useMemo(() => chooseMapZoom(bounds), [bounds]);
  const [zoom, setZoom] = useState(fittedZoom);
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const center = latLngToWorldPoint(centerLat, centerLng, zoom);
  const tiles = getMapTiles(center, zoom);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="relative min-h-[320px] overflow-hidden rounded-[1.5rem] border border-canopy/10 bg-skywash">
        {tiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={tile.key}
            alt=""
            src={tile.src}
            className="absolute h-64 w-64 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
            style={tile.style}
            draggable={false}
          />
        ))}
        <div className="absolute inset-0 bg-canopy/5" />
        <div className="absolute right-3 top-3 z-[1] overflow-hidden rounded-2xl border border-canopy/10 bg-white/95 text-canopy shadow-sm">
          <button
            type="button"
            onClick={() => setZoom((currentZoom) => Math.min(MAP_MAX_ZOOM, currentZoom + 1))}
            disabled={zoom >= MAP_MAX_ZOOM}
            className="block h-10 w-10 text-lg font-black transition hover:bg-canopy/5 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((currentZoom) => Math.max(MAP_MIN_ZOOM, currentZoom - 1))}
            disabled={zoom <= MAP_MIN_ZOOM}
            className="block h-10 w-10 border-t border-canopy/10 text-lg font-black transition hover:bg-canopy/5 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoom(fittedZoom)}
            className="block h-9 w-10 border-t border-canopy/10 text-[10px] font-bold uppercase transition hover:bg-canopy/5"
            aria-label="Reset map zoom"
          >
            Fit
          </button>
        </div>
        {feeders.map((feeder) => {
          const healthy = isRecentlyServiced(feeder);
          const position = markerPosition(feeder.latitude, feeder.longitude, center, zoom);

          return (
            <Link
              key={feeder.id}
              href={`/feeders/${feeder.id}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={position}
              aria-label={`${feeder.name}: ${healthy ? "fresh" : "needs service"}`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-lg transition hover:scale-110 ${
                  healthy ? "bg-emerald-500" : "bg-rose-500"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
              </span>
              <span className="pointer-events-none absolute left-1/2 top-9 w-40 -translate-x-1/2 rounded-2xl bg-white px-3 py-2 text-center text-xs font-bold text-canopy opacity-0 shadow-lg transition group-hover:opacity-100 group-focus:opacity-100">
                {feeder.name}
                <span className="block font-medium text-canopy/55">
                  {feeder.latestMeasurement?.fillPercent ?? 0}% full
                </span>
                <span className="block truncate font-medium text-canopy/55">{feeder.assignedUser}</span>
              </span>
            </Link>
          );
        })}
        <div className="absolute bottom-2 right-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-canopy/70 shadow-sm">
          Map data © OpenStreetMap contributors
        </div>
      </div>

      <div className="space-y-3">
        {feeders.map((feeder) => {
          const healthy = isRecentlyServiced(feeder);

          return (
            <Link
              key={feeder.id}
              href={`/feeders/${feeder.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl bg-canopy/5 p-4 transition hover:bg-canopy/10"
            >
              <div className="flex items-center gap-3">
                <span className={`h-3.5 w-3.5 rounded-full ${healthy ? "bg-emerald-500" : "bg-rose-500"}`} />
                <div>
                  <p className="font-bold text-canopy">{feeder.name}</p>
                  <p className="text-sm text-canopy/60">
                    {formatStatus(feeder.cleanStatus)} - assigned to {feeder.assignedUser}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-canopy">{feeder.latestMeasurement?.fillPercent ?? 0}%</p>
                <p className="text-canopy/55">feed</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
