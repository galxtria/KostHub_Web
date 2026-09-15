// Format jarak (km, desimal koma Indonesia). <1 km jadi meter.
export const formatDistance = (km) => {
  if (km === null || km === undefined || Number.isNaN(Number(km))) return null;
  const n = Number(km);
  if (n < 1) return `${Math.max(50, Math.round(n * 1000))} m`;
  return `${n.toFixed(1).replace('.', ',')} km`;
};
