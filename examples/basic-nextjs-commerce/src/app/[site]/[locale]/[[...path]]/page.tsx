import { isDesignLibraryPreviewData } from "@sitecore-content-sdk/nextjs/editing";
import { notFound } from "next/navigation";
import { draftMode, headers as nextHeaders } from "next/headers";
import { SiteInfo } from "@sitecore-content-sdk/nextjs";
import sites from ".sitecore/sites.json";
import { routing } from "src/i18n/routing";
import scConfig from "sitecore.config";
import client from "src/lib/sitecore-client";
import Layout, { RouteFields } from "src/Layout";
import components from ".sitecore/component-map";
import Providers from "src/Providers";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getBaseUrl } from "lib/utils";

type RenderingNode = {
  uid?: string;
  placeholders?: Record<string, RenderingNode[]>;
};

const SCRIPT_TAG_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

const sanitizeScriptsInObject = (value: unknown): void => {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => sanitizeScriptsInObject(item));
    return;
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
    if (typeof nestedValue === "string") {
      (value as Record<string, unknown>)[key] = nestedValue.replace(SCRIPT_TAG_PATTERN, "");
      return;
    }

    sanitizeScriptsInObject(nestedValue);
  });
};

const ensureRenderingUids = (
  placeholders: Record<string, RenderingNode[]> | undefined,
  prefix = "root",
  seenUids = new Set<string>()
) => {
  if (!placeholders) {
    return;
  }

  Object.entries(placeholders).forEach(([placeholderName, renderings]) => {
    renderings.forEach((rendering, index) => {
      const fallbackUid = `${prefix}-${placeholderName}-${index}`;
      const currentUid = rendering.uid || fallbackUid;

      if (!seenUids.has(currentUid)) {
        rendering.uid = currentUid;
        seenUids.add(currentUid);
      } else {
        let dedupIndex = 1;
        let dedupUid = `${currentUid}-${dedupIndex}`;
        while (seenUids.has(dedupUid)) {
          dedupIndex += 1;
          dedupUid = `${currentUid}-${dedupIndex}`;
        }

        rendering.uid = dedupUid;
        seenUids.add(dedupUid);
      }

      ensureRenderingUids(rendering.placeholders, rendering.uid, seenUids);
    });
  });
};

const summarizeRenderingUids = (placeholders: Record<string, RenderingNode[]> | undefined) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  let total = 0;
  let missingBeforeFix = 0;

  const walk = (nested: Record<string, RenderingNode[]> | undefined) => {
    if (!nested) {
      return;
    }
    Object.values(nested).forEach((renderings) => {
      renderings.forEach((rendering) => {
        total += 1;
        if (!rendering.uid) {
          missingBeforeFix += 1;
        } else if (seen.has(rendering.uid)) {
          duplicates.add(rendering.uid);
        } else {
          seen.add(rendering.uid);
        }
        walk(rendering.placeholders);
      });
    });
  };

  walk(placeholders);
  return { total, missingBeforeFix, duplicateCount: duplicates.size };
};

type PageProps = {
  params: Promise<{
    site: string;
    locale: string;
    path?: string[];
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { site, locale, path } = await params;
  const draft = await draftMode();

  // Set site and locale to be available in src/i18n/request.ts for fetching the dictionary
  setRequestLocale(`${site}_${locale}`);

  // Fetch the page data from Sitecore
  let page;
  if (draft.isEnabled) {
    const headers = await nextHeaders();
    const previewData = client.getPreviewData(headers);
    if (isDesignLibraryPreviewData(previewData)) {
      page = await client.getDesignLibraryData(previewData);
    } else {
      page = await client.getPreview(previewData);
    }
  } else {
    page = await client.getPage(path ?? [], { site, locale });
  }

  // If the page is not found, return a 404
  if (!page) {
    notFound();
  }

  if (draft.isEnabled) {
    const uidSummary = summarizeRenderingUids(
      page.layout.sitecore.route?.placeholders as Record<string, RenderingNode[]> | undefined
    );
    console.warn("[debug] uid-summary", uidSummary);
    sanitizeScriptsInObject(page.layout.sitecore.route);
  }

  // Some editor payloads can omit rendering uids, which then causes React key warnings.
  ensureRenderingUids(page.layout.sitecore.route?.placeholders as Record<string, RenderingNode[]> | undefined);

  // Fetch the component data from Sitecore (Likely will be deprecated)
  const componentProps = await client.getComponentData(
    page.layout,
    {},
    components,
  );

  return (
    <NextIntlClientProvider>
      <Providers page={page} componentProps={componentProps}>
        <Layout page={page} />
      </Providers>
    </NextIntlClientProvider>
  );
}

// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const generateStaticParams = async () => {
  if (process.env.NODE_ENV !== "development" && scConfig.generateStaticPaths) {
    // Filter sites to only include the sites this starter is designed to serve.
    // This prevents cross-site build errors when multiple starters share the same XM Cloud instance.
    const defaultSite = scConfig.defaultSite;
    const allowedSites = defaultSite
      ? sites
          .filter((site: SiteInfo) => site.name === defaultSite)
          .map((site: SiteInfo) => site.name)
      : sites.map((site: SiteInfo) => site.name);
    return await client.getAppRouterStaticParams(
      allowedSites,
      routing.locales.slice(),
    );
  }
  return [];
};

// Metadata fields for the page.
export const generateMetadata = async ({ params }: PageProps) => {
  const baseUrl = getBaseUrl();

  const { path, site, locale } = await params;

  // Canonical URL: base URL + content path only (no site/locale segments)
  const pathSegment = path?.length ? `/${path.join("/")}` : "";
  const canonicalUrl = baseUrl ? `${baseUrl}${pathSegment}` : undefined;

  // The same call as for rendering the page. Should be cached by default react behavior
  const page = await client.getPage(path ?? [], { site, locale });
  const fields = page?.layout.sitecore.route?.fields as RouteFields;

  // Parse keywords from comma-separated string to array
  const keywordsString = fields?.metadataKeywords?.value?.toString() || "";
  const keywords = keywordsString
    ? keywordsString.split(",").map((k: string) => k.trim())
    : [];

  return {
    title: fields?.Title?.value?.toString() || "Page",
    description:
      fields?.ogDescription?.value?.toString() ||
      fields?.metadataDescription?.value?.toString() ||
      "Sitecore Next.js Basic Example",
    keywords,
    ...(canonicalUrl && {
      alternates: {
        canonical: canonicalUrl,
      },
    }),
    openGraph: {
      title: fields?.ogTitle?.value?.toString() || "Page",
      description:
        fields?.ogDescription?.value?.toString() ||
        fields?.metadataDescription?.value?.toString() ||
        "Sitecore Next.js Basic Example",
      url: canonicalUrl,
      images: fields?.ogImage?.value?.src || fields?.thumbnailImage?.value?.src,
    },
  };
};
