import type React from 'react';
import { Link as EditableLink, Text, type Field, type ImageField, type LinkField } from '@sitecore-content-sdk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Default as ImageWrapper } from '@/components/image/ImageWrapper.dev';
import {
  type ComponentProps,
  getDatasource,
  getFieldValue,
  normalizeFieldShape,
} from '@/lib/component-props';
import { NoDataFallback } from '@/utils/NoDataFallback';

type ProductCardDatasource = {
  title?: { jsonValue?: Field<string> };
  productName?: { jsonValue?: Field<string> };
  description?: { jsonValue?: Field<string> };
  productFeatureText?: { jsonValue?: Field<string> };
  image?: { jsonValue?: ImageField };
  productThumbnail?: { jsonValue?: ImageField };
  ctaLink?: { jsonValue?: LinkField };
  link?: { jsonValue?: LinkField };
};

type ProductCardFields = {
  data?: {
    datasource?: ProductCardDatasource;
  };
};

type ProductCardProps = ComponentProps & {
  fields?: ProductCardFields;
};

const renderLink = (linkField: LinkField | undefined, isPageEditing: boolean) => {
  if (!linkField) {
    return null;
  }

  if (isPageEditing) {
    return (
      <Button asChild className="w-full">
        <EditableLink field={linkField} />
      </Button>
    );
  }

  const href = linkField.value?.href;
  const text = linkField.value?.text;

  if (!href || !text) {
    return null;
  }

  return (
    <Button asChild className="w-full">
      <Link href={href}>{text}</Link>
    </Button>
  );
};

export const Default: React.FC<ProductCardProps> = (props) => {
  const datasource = normalizeFieldShape(
    getDatasource(props.fields as ProductCardFields | undefined)
  ) as ProductCardDatasource | undefined;

  if (!datasource) {
    return <NoDataFallback componentName="ProductCard" />;
  }

  const isPageEditing = props.page.mode.isEditing;
  const title = datasource.productName ?? datasource.title;
  const description = datasource.productFeatureText ?? datasource.description;
  const image = datasource.productThumbnail ?? datasource.image;
  const link = getFieldValue(datasource.ctaLink as { jsonValue?: LinkField } | undefined) ??
    getFieldValue(datasource.link as { jsonValue?: LinkField } | undefined);

  return (
    <article className="bg-background rounded-xl border p-6" data-component="ProductCard">
      {image?.jsonValue && (
        <figure className="mb-4">
          <ImageWrapper image={image.jsonValue} className="mx-auto" />
        </figure>
      )}
      <div className="space-y-3">
        {title?.jsonValue && (
          <Text
            tag="h3"
            className="text-secondary-foreground text-2xl font-semibold"
            field={title.jsonValue}
          />
        )}
        {description?.jsonValue && (
          <Text
            tag="p"
            className="text-muted-foreground text-base"
            field={description.jsonValue}
          />
        )}
        {renderLink(link, isPageEditing)}
      </div>
    </article>
  );
};
