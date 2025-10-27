"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";

interface UseAutoRefreshOptions {
  interval?: number; // em milissegundos
  enabled?: boolean;
}

export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const { interval = 30000, enabled = true } = options; // 30 segundos por padrão
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    router.refresh();
    setLastRefresh(new Date());

    // Pequeno delay para feedback visual
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [router]);

  // Auto-refresh periódico
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, refresh]);

  return {
    refresh,
    isRefreshing,
    lastRefresh,
  };
}
