import React, { useMemo } from 'react';
import styled from 'styled-components';
import { SERVICE_GROUPS, formatCategoryLabel } from '../../constants/salonServiceCatalog';
import { mapToServicesArray, toggleCatalogService } from '../../utils/salonServices';

const Group = styled.div`
  margin-bottom: 1.5rem;
`;

const GroupTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  color: #222;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 0.75rem 1rem;
  align-items: center;
  padding: 0.65rem 0;
  border-bottom: 1px solid #f5f5f5;

  @media (max-width: 640px) {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;

    .price-fields {
      grid-column: 2;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  }

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: #e91e63;
  }

  .name {
    font-weight: 500;
    font-size: 0.95rem;
    color: #222;
  }

  .cat {
    font-size: 0.75rem;
    color: #888;
  }

  input[type='number'] {
    width: 100%;
    max-width: 100px;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  label.field-label {
    font-size: 0.7rem;
    color: #888;
    display: block;
  }
`;

const CustomSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px dashed #eee;
`;

const AddBtn = styled.button`
  margin-top: 0.5rem;
  padding: 8px 14px;
  border: 1px dashed #ccc;
  background: #fafafa;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: #e91e63;
    color: #c2185b;
  }
`;

const Summary = styled.p`
  font-size: 0.9rem;
  color: #555;
  margin: 0 0 1rem;
`;

/**
 * @param {Array} value - selected services array
 * @param {function} onChange
 * @param {boolean} showCustom - allow custom service rows
 */
const ServiceCatalogPicker = ({ value = [], onChange, showCustom = true }) => {
  const { catalogMap, customServices } = useMemo(() => {
    const map = new Map();
    const custom = [];
    (value || []).forEach((s) => {
      if (s.catalogId) map.set(s.catalogId, { ...s });
      else custom.push({ ...s });
    });
    return { catalogMap: map, customServices: custom };
  }, [value]);

  const emit = (map, custom) => {
    onChange([...mapToServicesArray(map), ...custom]);
  };

  const onToggle = (catalogId, checked) => {
    const next = toggleCatalogService(catalogMap, catalogId, checked);
    emit(next, customServices);
  };

  const updateCatalogField = (catalogId, field, val) => {
    const next = new Map(catalogMap);
    const current = next.get(catalogId);
    if (current) next.set(catalogId, { ...current, [field]: val });
    emit(next, customServices);
  };

  const updateCustom = (index, field, val) => {
    const next = customServices.map((s, i) => (i === index ? { ...s, [field]: val } : s));
    emit(catalogMap, next);
  };

  const addCustom = () => {
    emit(catalogMap, [
      ...customServices,
      { name: '', category: 'other', duration: 45, price: 0, isActive: true },
    ]);
  };

  const removeCustom = (index) => {
    emit(catalogMap, customServices.filter((_, i) => i !== index));
  };

  const selectedCount = catalogMap.size + customServices.length;

  return (
    <div>
      <Summary>
        {selectedCount === 0
          ? 'Select the services you offer and set your price (FCFA) and duration for each.'
          : `${selectedCount} service${selectedCount > 1 ? 's' : ''} selected`}
      </Summary>

      {SERVICE_GROUPS.map((group) => (
        <Group key={group.id}>
          <GroupTitle>{group.label}</GroupTitle>
          {group.items.map((item) => {
            const selected = catalogMap.has(item.catalogId);
            const svc = catalogMap.get(item.catalogId);
            return (
              <Item key={item.catalogId}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onToggle(item.catalogId, e.target.checked)}
                  aria-label={`Offer ${item.name}`}
                />
                <div>
                  <div className="name">{item.name}</div>
                  <div className="cat">{formatCategoryLabel(item.category)}</div>
                </div>
                {selected ? (
                  <div className="price-fields" style={{ display: 'contents' }}>
                    <div>
                      <label className="field-label">FCFA</label>
                      <input
                        type="number"
                        min={0}
                        value={svc?.price ?? item.defaultPrice}
                        onChange={(e) => updateCatalogField(item.catalogId, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="field-label">Min</label>
                      <input
                        type="number"
                        min={15}
                        value={svc?.duration ?? item.defaultDuration}
                        onChange={(e) => updateCatalogField(item.catalogId, 'duration', parseInt(e.target.value, 10) || 45)}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ gridColumn: 'span 2', fontSize: '0.8rem', color: '#aaa' }}>
                    from {item.defaultPrice.toLocaleString()} FCFA
                  </div>
                )}
              </Item>
            );
          })}
        </Group>
      ))}

      {showCustom && (
        <CustomSection>
          <GroupTitle>Custom services</GroupTitle>
          <p style={{ fontSize: '0.85rem', color: '#717171', marginBottom: '0.75rem' }}>
            Add a service not listed above.
          </p>
          {customServices.map((s, i) => (
            <Item key={`custom-${i}`}>
              <span />
              <div>
                <input
                  type="text"
                  placeholder="Service name"
                  value={s.name}
                  onChange={(e) => updateCustom(i, 'name', e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6 }}
                />
              </div>
              <div>
                <label className="field-label">FCFA</label>
                <input
                  type="number"
                  min={0}
                  value={s.price}
                  onChange={(e) => updateCustom(i, 'price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="field-label">Min</label>
                <input
                  type="number"
                  min={15}
                  value={s.duration}
                  onChange={(e) => updateCustom(i, 'duration', parseInt(e.target.value, 10) || 45)}
                />
              </div>
              <button type="button" onClick={() => removeCustom(i)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}>
                Remove
              </button>
            </Item>
          ))}
          <AddBtn type="button" onClick={addCustom}>+ Add custom service</AddBtn>
        </CustomSection>
      )}
    </div>
  );
};

export default ServiceCatalogPicker;
