"use client";

import { useState, useEffect, useCallback } from "react";

type UseFetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useFetch<T>(fetcher: () => Promise<T>): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || "Error");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch };
}
