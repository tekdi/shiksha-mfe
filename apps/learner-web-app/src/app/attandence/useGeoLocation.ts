"use client";

import { useCallback } from "react";

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const useGeolocation = () => {
  const getLocation = useCallback(
    async (enableHighAccuracy = false, retries = 2): Promise<GeoLocationData | null> => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        return null;
      }

      const attemptGetLocation = (attemptNumber: number): Promise<GeoLocationData | null> => {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            },
            (error) => {
              // If timeout and we have retries left, try again with longer timeout
              if (error.code === 3 && attemptNumber < retries) {
                console.log(`[Location] Timeout on attempt ${attemptNumber}, retrying...`);
                // Retry with exponential backoff: 15s, 20s, 25s
                setTimeout(() => {
                  attemptGetLocation(attemptNumber + 1).then(resolve);
                }, 1000 * attemptNumber);
              } else {
                console.error(`[Location] Error getting location (attempt ${attemptNumber}):`, error);
                resolve(null);
              }
            },
            {
              enableHighAccuracy,
              timeout: 15000 + (attemptNumber * 5000), // 15s, 20s, 25s for retries
              maximumAge: attemptNumber === 0 ? 0 : 30000, // Allow cached location on retries
            }
          );
        });
      };

      return attemptGetLocation(0);
    },
    []
  );

  return { getLocation };
};

export default useGeolocation;

