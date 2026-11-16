'use client';

import { useEffect, useState } from 'react';
import { useProducts } from '@sitecore-content-sdk/nextjs/commerce';
import { useMarketplaceClient } from '@/hooks/useMarketplaceClient';
import { toCommerceProduct } from '@/lib/commerce/products/mapper';
import {
  parseProductReferenceList,
  serializeProductReferenceList,
} from '@/lib/commerce/products/list-source';
import {
  parseProductReference,
  serializeProductReference,
  type ProductReference,
} from '@/lib/commerce/products/reference';

type OrderCloudProductPickerProps = {
  multiple: boolean;
};

const SEARCH_DEBOUNCE_MS = 250;

export default function OrderCloudProductPicker({
  multiple,
}: OrderCloudProductPickerProps) {
  const {
    client,
    error: marketplaceError,
    isLoading: isMarketplaceLoading,
  } = useMarketplaceClient();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductReference[]>([]);
  const [saving, setSaving] = useState(false);
  const list = useProducts(
    { search: search || undefined, pageSize: 20 },
    { select: toCommerceProduct }
  );
  const products = list.items;
  // Hide the previous results while a new search loads.
  const loadingProducts = list.isLoading || list.isRefetching;
  const productError = list.error
    ? list.error.message || 'Unable to load OrderCloud products'
    : null;

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setSearch(query.trim()),
      SEARCH_DEBOUNCE_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!client) return;
    void client.getValue().then((value: unknown) => {
      if (multiple) {
        setSelected(parseProductReferenceList(value));
        return;
      }
      const parsed = parseProductReference(value);
      setSelected(parsed ? [parsed] : []);
    });
  }, [client, multiple]);

  const save = async () => {
    const selectedProduct = selected[0];
    if (!client || !selectedProduct) return;
    setSaving(true);
    try {
      await client.setValue(
        multiple
          ? serializeProductReferenceList(selected)
          : serializeProductReference(selectedProduct),
        true,
      );
      await client.closeApp();
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!client) return;
    setSaving(true);
    try {
      await client.setValue('', true);
      await client.closeApp();
    } finally {
      setSaving(false);
    }
  };

  const selectProduct = (product: ProductReference) => {
    if (!multiple) {
      setSelected([product]);
      return;
    }

    setSelected((current) => {
      if (current.some((item) => item.id === product.id)) {
        return current.filter((item) => item.id !== product.id);
      }
      return [...current, product];
    });
  };

  const selectedSummary = multiple
    ? `${selected.length} selected`
    : selected[0]?.id;

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-5 bg-white p-6 text-slate-950">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {multiple ? 'Select OrderCloud products' : 'Select an OrderCloud product'}
        </h1>
        <p className="text-sm text-slate-600">
          Search the buyer catalog, select {multiple ? 'products' : 'a product'}, and save{' '}
          {multiple ? 'their stable OrderCloud IDs.' : 'its stable OrderCloud ID.'}
        </p>
      </header>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Search products</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search by product name or ID"
          className="w-full rounded border border-slate-300 px-3 py-2"
          autoFocus
        />
      </label>

      {marketplaceError && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
          Open this picker from its SitecoreAI custom field to enable Save.{' '}
          {marketplaceError.message}
        </p>
      )}
      {productError && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">
          {productError}
        </p>
      )}
      {loadingProducts && (
        <p className="text-sm text-slate-600">Loading products…</p>
      )}

      {!loadingProducts && !productError && (
        <fieldset className="space-y-2">
          <legend className="sr-only">OrderCloud products</legend>
          {products.length === 0 && (
            <p className="text-sm text-slate-600">No products found.</p>
          )}
          {products.map((product) => {
            const isSelected = selected.some((item) => item.id === product.id);
            return (
              <label
                key={product.id}
                className={`flex cursor-pointer gap-3 rounded border p-3 ${
                  isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name="product"
                  checked={isSelected}
                  onChange={() => selectProduct({ id: product.id })}
                  className="mt-1"
                />
                {(product.thumbnailUrl ?? product.imageUrl) && (
                  <img
                    src={product.thumbnailUrl ?? product.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded object-cover"
                  />
                )}
                <span className="min-w-0">
                  <span className="block font-medium">{product.name}</span>
                  <span className="block text-xs text-slate-600">
                    {product.id}
                  </span>
                  {(product.brand || product.category) && (
                    <span className="block text-xs text-slate-500">
                      {[product.brand, product.category]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-white py-4">
        <button
          type="button"
          onClick={() => void clear()}
          disabled={!client || saving}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Clear
        </button>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <span className="max-w-64 truncate text-sm text-slate-600">
              {selectedSummary}
            </span>
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={!client || selected.length === 0 || saving || isMarketplaceLoading}
            className="rounded bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : multiple ? 'Save products' : 'Save product'}
          </button>
        </div>
      </footer>
    </main>
  );
}
