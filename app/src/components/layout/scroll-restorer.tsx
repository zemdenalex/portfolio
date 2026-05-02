"use client";
import { useEffect } from "react";

export function ScrollRestorer() {
  useEffect(() => {
    const y = sessionStorage.getItem("scroll-pos");
    if (y !== null) {
      window.scrollTo(0, parseInt(y, 10));
      sessionStorage.removeItem("scroll-pos");
    }
  }, []);
  return null;
}
