/** Extract a human-readable city/town label from Nominatim address parts */
export function cityFromNominatimAddress(address = {}) {
  return (
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.state_district ||
    address.county ||
    ''
  );
}

export async function reverseGeocodeCity(lat, lng) {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=12&addressdetails=1`,
    {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'NailBook/1.0 (https://github.com/nailbook; salon discovery)',
      },
    }
  );
  if (!resp.ok) return '';
  const json = await resp.json();
  return cityFromNominatimAddress(json?.address || {}) || json?.name || '';
}

export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options,
    });
  });
}
