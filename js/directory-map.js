// =============================================
// SETTLE CLT — Directory Map Module
// Google Maps integration for directory page
// =============================================

// Super-group pin colors for markers
const GROUP_PIN_COLORS = {
  moving:    { background: '#00C9A7', glyph: '#fff', border: '#008870' },  // Teal
  official:  { background: '#3B82F6', glyph: '#fff', border: '#2563EB' },  // Blue
  home:      { background: '#F59E0B', glyph: '#fff', border: '#D97706' },  // Amber
  personal:  { background: '#EC4899', glyph: '#fff', border: '#DB2777' },  // Pink
  daily:     { background: '#8B5CF6', glyph: '#fff', border: '#7C3AED' },  // Purple
  lifestyle: { background: '#EF4444', glyph: '#fff', border: '#DC2626' },  // Red
};

// Charlotte center
const CLT_CENTER = { lat: 35.2271, lng: -80.8431 };

let directoryMap = null;
let mapMarkers = [];
let markerClusterer = null;
let mapInfoWindow = null;

/**
 * Initialize the Google Map
 */
async function initDirectoryMap() {
  if (directoryMap) return; // Already initialized

  try {
    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');

    const mapEl = document.getElementById('directory-map');
    if (!mapEl) return;

    directoryMap = new Map(mapEl, {
      zoom: 11,
      center: CLT_CENTER,
      mapId: 'DEMO_MAP_ID', // Replace with your Map ID for custom styling
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'cooperative',
    });

    mapInfoWindow = new InfoWindow({ disableAutoPan: false });

    // Build markers for current filtered services
    updateMapMarkers(typeof currentFilteredServices !== 'undefined' ? currentFilteredServices : SERVICES);

  } catch (err) {
    console.error('Google Maps failed to load:', err);
    const mapEl = document.getElementById('directory-map');
    if (mapEl) {
      mapEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:var(--text-secondary);">
          <div style="font-size:3rem;margin-bottom:1rem;">🗺️</div>
          <h3>Map unavailable</h3>
          <p>Please check your API key configuration.</p>
        </div>`;
    }
  }
}

/**
 * Update map markers based on filtered services
 * @param {Array} services - Filtered services to show on map
 */
async function updateMapMarkers(services) {
  if (!directoryMap) return;

  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');

  // Clear existing markers
  mapMarkers.forEach(m => m.map = null);
  mapMarkers = [];

  if (markerClusterer) {
    markerClusterer.clearMarkers();
  }

  // Create new markers
  services.forEach(service => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === service.category);
    const groupId = cat ? cat.group : 'moving';
    const colors = GROUP_PIN_COLORS[groupId] || GROUP_PIN_COLORS.moving;
    const coords = getServiceCoordinates(service.area || 'Charlotte Metro');

    // Create colored pin
    const pin = new PinElement({
      background: colors.background,
      borderColor: colors.border,
      glyphColor: colors.glyph,
      scale: service.featured ? 1.3 : 1.0,
    });

    const marker = new AdvancedMarkerElement({
      position: coords,
      map: directoryMap,
      content: pin.element,
      title: service.name,
    });

    // Info window on click
    marker.addListener('click', () => {
      const catName = cat ? cat.name : service.category;
      const catIcon = cat ? cat.icon : '📋';

      mapInfoWindow.setContent(`
        <div style="font-family:'Inter',sans-serif;max-width:280px;padding:4px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:1.5rem;">${catIcon}</span>
            <div>
              <h3 style="margin:0;font-size:15px;font-weight:700;color:#0F172A;">
                ${service.name}
                ${service.featured ? '<span style="color:#F59E0B;font-size:11px;"> ⭐ Featured</span>' : ''}
              </h3>
              <span style="font-size:11px;color:#64748B;">${catName} · ${service.area || 'Charlotte'}</span>
            </div>
          </div>
          <p style="margin:0 0 10px;font-size:13px;color:#475569;line-height:1.4;">${service.description}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${service.website ? `<a href="${service.website}" target="_blank" rel="noopener"
              style="display:inline-block;padding:5px 12px;background:#00C9A7;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">
              Visit Website</a>` : ''}
            ${service.phone ? `<a href="tel:${service.phone.replace(/[^0-9+]/g, '')}"
              style="display:inline-block;padding:5px 12px;background:#E2E8F0;color:#334155;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">
              📞 ${service.phone}</a>` : ''}
          </div>
        </div>
      `);
      mapInfoWindow.open(directoryMap, marker);
    });

    mapMarkers.push(marker);
  });

  // Add marker clusterer
  if (typeof markerClusterer !== 'undefined' && markerClusterer !== null) {
    markerClusterer.clearMarkers();
    markerClusterer.addMarkers(mapMarkers);
  } else if (typeof MarkerClusterer !== 'undefined') {
    markerClusterer = new MarkerClusterer({ markers: mapMarkers, map: directoryMap });
  }

  // Fit bounds if markers exist
  if (mapMarkers.length > 0 && mapMarkers.length < SERVICES.length) {
    const bounds = new google.maps.LatLngBounds();
    mapMarkers.forEach(m => bounds.extend(m.position));
    directoryMap.fitBounds(bounds, 50);
  } else {
    directoryMap.setCenter(CLT_CENTER);
    directoryMap.setZoom(11);
  }
}

/**
 * Toggle between grid and map views
 */
function toggleDirectoryView(view) {
  const grid = document.getElementById('directory-grid');
  const map = document.getElementById('directory-map');
  const gridBtn = document.getElementById('view-grid-btn');
  const mapBtn = document.getElementById('view-map-btn');
  const emptyState = document.getElementById('directory-empty');
  const legend = document.getElementById('map-legend');

  if (!grid || !map) return;

  if (view === 'map') {
    grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    map.style.display = 'block';
    if (legend) legend.style.display = 'flex';
    gridBtn.classList.remove('active');
    mapBtn.classList.add('active');

    // Initialize map on first show
    if (!directoryMap) {
      initDirectoryMap();
    } else {
      // Trigger resize for proper rendering
      google.maps.event.trigger(directoryMap, 'resize');
    }
  } else {
    grid.style.display = '';
    map.style.display = 'none';
    if (legend) legend.style.display = 'none';
    gridBtn.classList.add('active');
    mapBtn.classList.remove('active');
  }
}
