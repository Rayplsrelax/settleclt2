// =============================================
// SETTLE CLT — Charlotte Area Coordinates
// Maps area names from services data → lat/lng
// =============================================

const AREA_COORDINATES = {
  // Core Charlotte
  'Uptown':           { lat: 35.2271, lng: -80.8431 },
  'Charlotte':        { lat: 35.2271, lng: -80.8431 },
  'Charlotte Metro':  { lat: 35.2271, lng: -80.8531 },

  // Popular Neighborhoods
  'South End':        { lat: 35.2116, lng: -80.8580 },
  'NoDa':             { lat: 35.2495, lng: -80.8191 },
  'Plaza Midwood':    { lat: 35.2193, lng: -80.8093 },
  'Dilworth':         { lat: 35.2083, lng: -80.8520 },
  'Myers Park':       { lat: 35.1886, lng: -80.8279 },
  'Elizabeth':        { lat: 35.2160, lng: -80.8280 },
  'SouthPark':        { lat: 35.1550, lng: -80.8300 },
  'SouthPark Mall':   { lat: 35.1550, lng: -80.8270 },
  'Ballantyne':       { lat: 35.0560, lng: -80.8480 },
  'LoSo':             { lat: 35.2000, lng: -80.8610 },

  // Greater Charlotte
  'University Area':  { lat: 35.3100, lng: -80.7330 },
  'East Charlotte':   { lat: 35.2200, lng: -80.7700 },
  'West Charlotte':   { lat: 35.2400, lng: -80.9100 },
  'North Charlotte':  { lat: 35.2900, lng: -80.8400 },
  'Huntersville':     { lat: 35.4108, lng: -80.8429 },
  'Lake Norman':      { lat: 35.4300, lng: -80.8700 },
  'Concord':          { lat: 35.4088, lng: -80.5795 },
  'Fort Mill':        { lat: 35.0074, lng: -80.9451 },
  'Matthews':         { lat: 35.1168, lng: -80.7237 },
  'Pineville':        { lat: 35.0832, lng: -80.8923 },
  'Mint Hill':        { lat: 35.1796, lng: -80.6468 },

  // Specific Landmarks & Areas
  'Camp North End':   { lat: 35.2486, lng: -80.8524 },
  'North End':        { lat: 35.2486, lng: -80.8524 },
  'Shalom Park':      { lat: 35.1650, lng: -80.8150 },
  'Yorkmont Rd':      { lat: 35.1900, lng: -80.9050 },
  'Mecklenburg County': { lat: 35.2500, lng: -80.8360 },

  // Virtual / Online
  'Online':           { lat: 35.2271, lng: -80.8431 },
  'Nationwide':       { lat: 35.2271, lng: -80.8431 }
};

/**
 * Get coordinates for a service listing's area.
 * Adds slight random offset to prevent marker stacking.
 * @param {string} area - The area name from the service listing
 * @returns {{ lat: number, lng: number }}
 */
function getServiceCoordinates(area) {
  const base = AREA_COORDINATES[area] || AREA_COORDINATES['Charlotte Metro'];
  // Add tiny random offset (±0.003 degrees ≈ 300m) to spread markers
  const offset = () => (Math.random() - 0.5) * 0.006;
  return {
    lat: base.lat + offset(),
    lng: base.lng + offset()
  };
}
