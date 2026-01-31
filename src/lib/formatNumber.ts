import Decimal from "break_infinity.js";

export function formatNumber(num: Decimal | number, decimals: number = 2): string {
  const d = num instanceof Decimal ? num : new Decimal(num);
  
  if (d.lt(1000)) {
    return d.toFixed(decimals);
  }
  
  if (d.lt(1e6)) {
    return d.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  
  if (d.lt(1e9)) {
    return (d.toNumber() / 1e6).toFixed(2) + " M";
  }
  
  if (d.lt(1e12)) {
    return (d.toNumber() / 1e9).toFixed(2) + " B";
  }
  
  if (d.lt(1e15)) {
    return (d.toNumber() / 1e12).toFixed(2) + " T";
  }
  
  // Scientific notation for very large numbers
  return d.toExponential(2);
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
