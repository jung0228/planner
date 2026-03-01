"use client";

import { useEffect, useState } from "react";

/**
 * Hydration 방지: 마운트된 후에만 true.
 * localStorage, Date 등 서버/클라이언트 불일치 시 사용.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
