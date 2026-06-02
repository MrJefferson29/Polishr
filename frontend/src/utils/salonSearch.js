/** Match salons by name, tagline, or any service name/category */
export function filterSalonsByQuery(salons, query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  return (salons || [])
    .filter((salon) => salonMatchesQuery(salon, q))
    .slice(0, limit);
}

export function salonMatchesQuery(salon, qLower) {
  if (!salon || !qLower) return false;
  if (salon.name?.toLowerCase().includes(qLower)) return true;
  if (salon.title?.toLowerCase().includes(qLower)) return true;
  return (salon.services || []).some(
    (s) =>
      s.isActive !== false &&
      (s.name?.toLowerCase().includes(qLower) || s.category?.toLowerCase().includes(qLower))
  );
}

export function getSalonThumbnail(salon) {
  const place = salon?.placeImages?.[0];
  const work = salon?.workImages?.[0];
  return place || work || null;
}

export function getFeaturedServices(salon, count = 2) {
  return (salon?.services || [])
    .filter((s) => s.isActive !== false && s.name)
    .slice(0, count);
}

export function collectSalonImages(salons) {
  const urls = [];
  (salons || []).forEach((s) => {
    (s.placeImages || []).forEach((u) => u && urls.push(u));
    (s.workImages || []).forEach((u) => u && urls.push(u));
  });
  return urls;
}

export function pickRandomImage(urls, fallback) {
  if (!urls?.length) return fallback;
  return urls[Math.floor(Math.random() * urls.length)];
}

/** Collect all images for a salon and return up to `count` shuffled picks */
export function getSalonRandomImages(salon, count = 4) {
  const all = [
    ...(salon?.placeImages || []),
    ...(salon?.workImages || []),
  ].filter(Boolean);
  if (!all.length) return [];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, all.length));
  while (picked.length < count && all.length) {
    picked.push(all[picked.length % all.length]);
  }
  return picked.slice(0, count);
}
