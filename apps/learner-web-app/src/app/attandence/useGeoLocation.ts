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
        console.error("[Location] Geolocation not supported");
        return null;
      }

      const attemptGetLocation = (attemptNumber: number, useHighAcc = enableHighAccuracy): Promise<GeoLocationData | null> => {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log(`[Location] Success on attempt ${attemptNumber}`, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                highAccuracy: useHighAcc,
              });
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            },
            (error) => {
              console.error(`[Location] Error on attempt ${attemptNumber}:`, {
                code: error.code,
                message: error.message,
                highAccuracy: useHighAcc,
              });

              // Error codes:
              // 1 = PERMISSION_DENIED
              // 2 = POSITION_UNAVAILABLE (GPS not getting a fix)
              // 3 = TIMEOUT

              // If position unavailable (GPS not getting fix) and we're using high accuracy, try with low accuracy
              if (error.code === 2 && useHighAcc && attemptNumber === 0) {
                console.log("[Location] High accuracy failed, trying with low accuracy...");
                setTimeout(() => {
                  attemptGetLocation(0, false).then(resolve);
                }, 1000);
                return;
              }

              // If timeout and we have retries left, try again with longer timeout
              if (error.code === 3 && attemptNumber < retries) {
                console.log(`[Location] Timeout on attempt ${attemptNumber}, retrying with longer timeout...`);
                setTimeout(() => {
                  attemptGetLocation(attemptNumber + 1, useHighAcc).then(resolve);
                }, 2000 * (attemptNumber + 1));
                return;
              }

              // If position unavailable (GPS not getting fix) and we have retries, try again
              if (error.code === 2 && attemptNumber < retries) {
                console.log(`[Location] Position unavailable on attempt ${attemptNumber}, retrying...`);
                setTimeout(() => {
                  attemptGetLocation(attemptNumber + 1, false).then(resolve);
                }, 2000 * (attemptNumber + 1));
                return;
              }

              // Permission denied - don't retry, user needs to grant permission
              if (error.code === 1) {
                console.error("[Location] Permission denied by user");
                resolve(null);
                return;
              }

              // All retries exhausted or other error
              console.error(`[Location] Failed after ${attemptNumber + 1} attempts`);
              resolve(null);
            },
            {
              enableHighAccuracy: useHighAcc,
              timeout: 20000 + (attemptNumber * 5000), // 20s, 25s, 30s for retries
              maximumAge: attemptNumber === 0 ? 0 : 60000, // Allow cached location on retries (up to 60s old)
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

