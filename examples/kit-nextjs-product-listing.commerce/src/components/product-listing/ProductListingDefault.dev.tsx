'use client';

import { Text } from '@sitecore-content-sdk/nextjs';
import React, { useEffect, useMemo, useState } from 'react';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { Default as AnimatedSection } from '@/components/animated-section/AnimatedSection.dev';
import { ProductListingProps, ProductItemProps } from './product-listing.props';
import { ProductListingCard } from './ProductListingCard.dev';
import { CardSpotlight } from '@/components/card-spotlight/card-spotlight.dev';
import { useMatchMedia } from '@/hooks/use-match-media';
import { cn } from '@/lib/utils';
import { generateProductSchema } from '@/lib/structured-data/schema';
import { StructuredData } from '@/components/structured-data/StructuredData';
import type { CommerceProduct, CommerceProductList } from '@/lib/commerce/products';

const CommerceProductCard = ({
  product,
  prefersReducedMotion,
}: {
  product: CommerceProduct;
  prefersReducedMotion: boolean;
}) => (
  <CardSpotlight className="h-full w-full" prefersReducedMotion={prefersReducedMotion}>
    <article
      className="@md:px-12 @md:py-12 font-heading relative z-10 flex h-full w-full flex-col justify-between gap-8 px-6 py-10"
      data-component="OrderCloudProductCard"
      itemScope
      itemType="https://schema.org/Product"
    >
      {product.imageUrl && (
        <figure className="relative overflow-hidden">
          <img src={product.imageUrl} alt="" className="mx-auto" itemProp="image" />
        </figure>
      )}
      <div className="space-y-4">
        <h3 className="text-secondary-foreground text-2xl font-semibold" itemProp="name">
          {product.name}
        </h3>
        {(product.brand || product.category) && (
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            {product.brand}
            {product.brand && product.category ? ' · ' : ''}
            {product.category}
          </p>
        )}
        {product.description && (
          <p className="text-muted-foreground text-base font-light" itemProp="description">
            {product.description}
          </p>
        )}
        {product.price !== undefined && (
          <p className="text-muted-foreground text-base font-light" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <span itemProp="price">{product.price}</span>
            {product.currency && <meta itemProp="priceCurrency" content={product.currency} />}
          </p>
        )}
      </div>
    </article>
  </CardSpotlight>
);

export const ProductListingDefault: React.FC<ProductListingProps> = (props) => {
  const isReducedMotion = useMatchMedia('(prefers-reduced-motion: reduce)');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [commerceProducts, setCommerceProducts] = useState<CommerceProduct[] | null>(null);
  const [commerceError, setCommerceError] = useState<string | null>(null);
  const { fields, isPageEditing } = props;
  const { products, title, viewAllLink } = fields?.data?.datasource ?? {};

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        const response = await fetch('/api/commerce/products', { signal: controller.signal });
        const payload = (await response.json()) as CommerceProductList & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load OrderCloud products');
        }

        setCommerceProducts(payload.items);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setCommerceError(error instanceof Error ? error.message : 'Failed to load OrderCloud products');
      }
    };

    void loadProducts();
    return () => controller.abort();
  }, []);

  const displayProducts = commerceProducts ?? products?.targetItems?.slice(0, 3) ?? [];

  // Generate JSON-LD structured data for products (must be at top level)
  const productSchemas = useMemo(() => {
    return displayProducts.map((product) => {
      const isCommerceProduct = 'id' in product;
      const productName = isCommerceProduct ? product.name : product.productName?.jsonValue?.value || '';
      const productImage = isCommerceProduct
        ? product.imageUrl || ''
        : product.productThumbnail?.jsonValue?.value?.src || '';
      const productPrice = isCommerceProduct
        ? product.price?.toString() || ''
        : product.productBasePrice?.jsonValue?.value || '';
      const productUrl = isCommerceProduct ? '' : product.url?.path || '';
      const productDescription = isCommerceProduct
        ? product.description || ''
        : product.productFeatureText?.jsonValue?.value || '';

      return generateProductSchema({
        name: productName,
        image: productImage,
        description: productDescription,
        price: productPrice,
        priceCurrency: isCommerceProduct ? product.currency || 'USD' : 'USD',
        url: productUrl || undefined,
      });
    });
  }, [displayProducts]);

  if (fields) {
    const getCardClasses = (productId: string) => {
      if (isReducedMotion) {
        // Reduced motion version - no scaling, blur, or complex animations
        return cn(
          'transition-opacity duration-150',
          activeCard !== null && activeCard !== productId ? 'opacity-60' : '',
          activeCard === productId ? 'z-10' : ''
        );
      } else {
        // Full motion version
        return cn(
          'transition-all duration-500 ease-in-out',
          activeCard !== null && activeCard !== productId ? 'opacity-50 scale-95 blur-[2px]' : '',
          activeCard === productId ? 'scale-105 z-10' : ''
        );
      }
    };
    // Split products into two columns
    const leftColumnProducts =
      displayProducts.filter((_: ProductItemProps | CommerceProduct, index: number) => index % 2 === 1) || [];
    const rightColumnProducts =
      displayProducts.filter((_: ProductItemProps | CommerceProduct, index: number) => index % 2 === 0) || [];

    return (
      <section
        className={cn('@container transform-gpu border-b-2 border-t-2 [.border-b-2+&]:border-t-0', {
          [props?.params?.styles]: props?.params?.styles,
        })}
        aria-label="Product listing"
      >
        {/* JSON-LD structured data for products */}
        {productSchemas.map((schema, index) => (
          <StructuredData key={`product-schema-${index}`} id={`product-schema-${index}`} data={schema} />
        ))}
        <div className="@md:px-6 @md:py-20 @lg:py-28 mx-auto max-w-screen-xl px-4 py-12">
          <AnimatedSection
            direction="down"
            duration={400}
            reducedMotion={isReducedMotion}
            className="@md:items-end @md:flex-row mb-8 flex flex-col items-start justify-between"
            isPageEditing={isPageEditing}
          >
            <div>
              <Text
                tag="h2"
                className={cn(
                  '@md:text-5xl @md:w-1/2 w-full text-pretty text-7xl font-light tracking-tight antialiased',
                  {
                    ' @md:absolute': leftColumnProducts.length >= 1, //if there is 1 product.
                  }
                )}
                field={title?.jsonValue}
              />
            </div>
          </AnimatedSection>

          <div className="@md:grid-cols-2 @md:gap-[68px] grid grid-cols-1 gap-[40px]">
            {commerceError && displayProducts.length === 0 && (
              <p className="text-muted-foreground col-span-full text-base">{commerceError}</p>
            )}
            {commerceProducts === null && !commerceError && displayProducts.length === 0 && (
              <p className="text-muted-foreground col-span-full text-base">Loading products...</p>
            )}
            {/* Left column - offset by 50% */}
            {leftColumnProducts.length > 0 && (
              <div className="@md:mt-1/2 @md:gap-[60px] flex flex-col gap-[40px]">
                {leftColumnProducts.map((product, index) => (
                  <AnimatedSection
                    key={'id' in product ? product.id : JSON.stringify(`${product.productName}-${index}`)}
                    direction="up"
                    delay={index * 150}
                    duration={400}
                    reducedMotion={isReducedMotion}
                    isPageEditing={isPageEditing}
                  >
                    <div
                      className={getCardClasses(`left-${index}`)}
                      onMouseEnter={() => setActiveCard(`left-${index}`)}
                      onMouseLeave={() => setActiveCard(null)}
                      onFocus={() => setActiveCard(`left-${index}`)}
                      onBlur={() => setActiveCard(null)}
                    >
                      {'id' in product ? (
                        <CommerceProductCard product={product} prefersReducedMotion={isReducedMotion} />
                      ) : (
                        <ProductListingCard
                          product={product}
                          link={viewAllLink.jsonValue}
                          prefersReducedMotion={isReducedMotion}
                          isPageEditing={isPageEditing}
                        />
                      )}
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            )}
            {/* right column */}
            {rightColumnProducts.length > 0 && (
              <div className="@md:gap-[60px] flex flex-col gap-[40px]">
                {rightColumnProducts.map((product, index) => (
                  <AnimatedSection
                    key={'id' in product ? product.id : JSON.stringify(`${product.productName}-${index}`)}
                    direction="up"
                    delay={index * 150}
                    duration={400}
                    reducedMotion={isReducedMotion}
                    isPageEditing={isPageEditing}
                  >
                    <div
                      className={getCardClasses(`right-${index}`)}
                      onMouseEnter={() => setActiveCard(`right-${index}`)}
                      onMouseLeave={() => setActiveCard(null)}
                      onFocus={() => setActiveCard(`right-${index}`)}
                      onBlur={() => setActiveCard(null)}
                    >
                      {'id' in product ? (
                        <CommerceProductCard product={product} prefersReducedMotion={isReducedMotion} />
                      ) : (
                        <ProductListingCard
                          product={product}
                          link={viewAllLink.jsonValue}
                          prefersReducedMotion={isReducedMotion}
                          isPageEditing={isPageEditing}
                        />
                      )}
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return <NoDataFallback componentName="ProductListing" />;
};
