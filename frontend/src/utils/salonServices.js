import { ALL_CATALOG_ITEMS, getCatalogItem } from '../constants/salonServiceCatalog';

export const serviceFromCatalog = (catalogItem, overrides = {}) => ({
  catalogId: catalogItem.catalogId,
  name: catalogItem.name,
  category: catalogItem.category,
  duration: overrides.duration ?? catalogItem.defaultDuration,
  price: overrides.price ?? catalogItem.defaultPrice,
  isActive: overrides.isActive !== false,
});

export const normalizeServicesForApi = (services) =>
  (services || [])
    .filter((s) => s.isActive !== false && s.name && Number(s.price) >= 0)
    .map(({ name, category, duration, price, isActive, catalogId, description }) => ({
      name: String(name).trim(),
      category: category || 'other',
      duration: parseInt(duration, 10) || 45,
      price: parseFloat(price) || 0,
      isActive: isActive !== false,
      description: description || '',
      ...(catalogId ? { catalogId } : {}),
    }));

export const mergeServicesWithCatalog = (existingServices = []) => {
  const byKey = new Map();
  existingServices.forEach((s) => {
    const key = s.catalogId || s.name;
    if (key) byKey.set(key, { ...s });
  });
  return byKey;
};

export const servicesToPickerState = (existingServices = []) => {
  const map = mergeServicesWithCatalog(existingServices);
  return map;
};

export const isCatalogServiceSelected = (selectedMap, catalogId) => selectedMap.has(catalogId);

export const toggleCatalogService = (selectedMap, catalogId, enabled) => {
  const next = new Map(selectedMap);
  if (enabled) {
    const item = getCatalogItem(catalogId);
    if (item) next.set(catalogId, serviceFromCatalog(item, next.get(catalogId) || {}));
  } else {
    next.delete(catalogId);
  }
  return next;
};

export const mapToServicesArray = (selectedMap) => Array.from(selectedMap.values());

export const matchExistingToCatalog = (existingServices = []) => {
  const map = new Map();
  existingServices.forEach((s) => {
    const catalog = ALL_CATALOG_ITEMS.find(
      (c) => c.catalogId === s.catalogId || c.name.toLowerCase() === (s.name || '').toLowerCase()
    );
    if (catalog) {
      map.set(catalog.catalogId, {
        ...serviceFromCatalog(catalog, s),
        price: s.price ?? catalog.defaultPrice,
        duration: s.duration ?? catalog.defaultDuration,
      });
    }
  });
  const customs = existingServices.filter(
    (s) => !ALL_CATALOG_ITEMS.some(
      (c) => c.catalogId === s.catalogId || c.name.toLowerCase() === (s.name || '').toLowerCase()
    )
  );
  return { catalogMap: map, customServices: customs };
};
