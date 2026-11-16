import type {
  PriceMarkupType,
  Spec,
  SpecOption,
  SpecSelection,
  SpecSelectionIssue,
  SpecSelectionIssueCode,
} from "@sitecore-content-sdk/nextjs/commerce";
import { asFiniteNumber, asNonEmptyString, asRecord } from "../normalization";

// OrderCloud spec rules (required, open text, variants) live in the SDK option helpers. This module
// owns the site conventions: presentation and value constraints read from `spec.xp`, and the
// English messages for SDK and starter issue codes.

export const productSpecOptionControls = [
  "dropdown",
  "buttons",
  "radio",
  "swatches",
  "images",
  "cards",
] as const;
export type ProductSpecOptionControl =
  (typeof productSpecOptionControls)[number];

export const productSpecTextControls = [
  "text",
  "textarea",
  "number",
  "date",
] as const;
export type ProductSpecTextControl = (typeof productSpecTextControls)[number];

export type ProductSpecPresentation = {
  control?: ProductSpecOptionControl;
  textControl?: ProductSpecTextControl;
  label?: string;
  helpText?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
};

export type ProductSpecValidation = {
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  minDate?: string;
  maxDate?: string;
};

export type ProductSpecOptionPresentation = {
  label?: string;
  description?: string;
  color?: string;
  imageUrl?: string;
  badge?: string;
};

export type CommerceProductSpecOption = {
  id: string;
  name: string;
  isOpenText: boolean;
  priceMarkupType?: PriceMarkupType;
  priceMarkup?: number;
  presentation: ProductSpecOptionPresentation;
};

/** Presentation view of a raw OrderCloud `Spec` used by `ProductSpecFields`. */
export type CommerceProductSpec = {
  id: string;
  name: string;
  required: boolean;
  allowOpenText: boolean;
  definesVariant: boolean;
  options: CommerceProductSpecOption[];
  presentation: ProductSpecPresentation;
  validation: ProductSpecValidation;
};

/** Value-constraint issue codes added by the starter's `validateSpec` (from `spec.xp.validation`). */
export type ProductSpecValueIssueCode =
  | "min-length"
  | "max-length"
  | "invalid-number"
  | "min"
  | "max"
  | "step"
  | "min-date"
  | "max-date";

export type ProductSpecIssueCode =
  | SpecSelectionIssueCode
  | ProductSpecValueIssueCode;

const oneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined =>
  typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;

const nonNegativeInteger = (value: unknown): number | undefined => {
  const number = asFiniteNumber(value, { allowNumericString: true });
  return number !== undefined && number >= 0 ? Math.floor(number) : undefined;
};

const safeImageUrl = (value: unknown): string | undefined => {
  const url = asNonEmptyString(value, { trim: true });
  return url && /^(https?:\/\/|\/(?!\/))/i.test(url) ? url : undefined;
};

const safeColor = (value: unknown): string | undefined => {
  const color = asNonEmptyString(value, { trim: true });
  return color &&
    /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
    ? color
    : undefined;
};

const safeDateConstraint = (value: unknown): string | undefined => {
  const date = asNonEmptyString(value, { trim: true });
  return date === "today" || (date && /^\d{4}-\d{2}-\d{2}$/.test(date))
    ? date
    : undefined;
};

/** Reads `spec.xp.presentation`. */
export const getSpecPresentation = (spec: Spec): ProductSpecPresentation => {
  const presentation = asRecord(asRecord(spec?.xp)?.presentation);
  return {
    control: oneOf(presentation?.control, productSpecOptionControls),
    textControl: oneOf(presentation?.textControl, productSpecTextControls),
    label: asNonEmptyString(presentation?.label, { trim: true }),
    helpText: asNonEmptyString(presentation?.helpText, { trim: true }),
    placeholder: asNonEmptyString(presentation?.placeholder, { trim: true }),
    prefix: asNonEmptyString(presentation?.prefix, { trim: true }),
    suffix: asNonEmptyString(presentation?.suffix, { trim: true }),
  };
};

/** Reads `spec.xp.validation`. */
export const getSpecValidation = (spec: Spec): ProductSpecValidation => {
  const validation = asRecord(asRecord(spec?.xp)?.validation);
  return {
    min: asFiniteNumber(validation?.min, { allowNumericString: true }),
    max: asFiniteNumber(validation?.max, { allowNumericString: true }),
    step: asFiniteNumber(validation?.step, { allowNumericString: true }),
    minLength: nonNegativeInteger(validation?.minLength),
    maxLength: nonNegativeInteger(validation?.maxLength),
    minDate: safeDateConstraint(validation?.minDate),
    maxDate: safeDateConstraint(validation?.maxDate),
  };
};

const toOptionPresentation = (
  option: SpecOption,
): ProductSpecOptionPresentation => {
  const presentation = asRecord(asRecord(option?.xp)?.presentation);
  return {
    label: asNonEmptyString(presentation?.label, { trim: true }),
    description: asNonEmptyString(presentation?.description, { trim: true }),
    color: safeColor(presentation?.color),
    imageUrl: safeImageUrl(presentation?.imageUrl),
    badge: asNonEmptyString(presentation?.badge, { trim: true }),
  };
};

const toSpecOption = (
  option: SpecOption,
): CommerceProductSpecOption | undefined => {
  const id = asNonEmptyString(option?.ID, { trim: true });
  const name = asNonEmptyString(option?.Value, { trim: true });
  if (!id || !name) return undefined;

  return {
    id,
    name,
    isOpenText: option?.IsOpenText === true,
    priceMarkupType: oneOf(option?.PriceMarkupType, [
      "NoMarkup",
      "AmountPerQuantity",
      "AmountTotal",
      "Percentage",
    ] satisfies readonly PriceMarkupType[]),
    priceMarkup: asFiniteNumber(option?.PriceMarkup),
    presentation: toOptionPresentation(option),
  };
};

/** Builds the presentation view of a raw spec; undefined when it has no usable ID or name. */
export const toCommerceProductSpec = (
  spec: Spec,
): CommerceProductSpec | undefined => {
  const id = asNonEmptyString(spec?.ID, { trim: true });
  const name = asNonEmptyString(spec?.Name, { trim: true });
  if (!id || !name) return undefined;

  const options = Array.isArray(spec?.Options)
    ? spec.Options.flatMap((option) => {
        const mapped = toSpecOption(option);
        return mapped ? [mapped] : [];
      })
    : [];

  return {
    id,
    name,
    required: spec?.Required === true,
    allowOpenText: spec?.AllowOpenText === true,
    definesVariant: spec?.DefinesVariant === true,
    options,
    presentation: getSpecPresentation(spec),
    validation: getSpecValidation(spec),
  };
};

export const resolveDateConstraint = (value?: string): string | undefined => {
  if (value !== "today") return value;
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const getValueIssue = (
  spec: Spec,
  value: string,
): SpecSelectionIssue<ProductSpecValueIssueCode> | undefined => {
  const validation = getSpecValidation(spec);
  const textControl = getSpecPresentation(spec).textControl ?? "text";
  const issue = (
    code: ProductSpecValueIssueCode,
    params?: Record<string, string | number>,
  ) => ({ specId: spec.ID, code, ...(params ? { params } : {}) });

  if (validation.minLength !== undefined && value.length < validation.minLength)
    return issue("min-length", { min: validation.minLength });
  if (validation.maxLength !== undefined && value.length > validation.maxLength)
    return issue("max-length", { max: validation.maxLength });

  if (textControl === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return issue("invalid-number");
    if (validation.min !== undefined && number < validation.min)
      return issue("min", { min: validation.min });
    if (validation.max !== undefined && number > validation.max)
      return issue("max", { max: validation.max });
    if (validation.step !== undefined && validation.step > 0) {
      const stepBase = validation.min ?? 0;
      const remainder = Math.abs((number - stepBase) % validation.step);
      if (
        remainder > Number.EPSILON * 10 &&
        Math.abs(remainder - validation.step) > Number.EPSILON * 10
      )
        return issue("step", { step: validation.step });
    }
  }

  if (textControl === "date") {
    const minDate = resolveDateConstraint(validation.minDate);
    const maxDate = resolveDateConstraint(validation.maxDate);
    if (minDate && value < minDate) return issue("min-date", { date: minDate });
    if (maxDate && value > maxDate) return issue("max-date", { date: maxDate });
  }

  return undefined;
};

/**
 * `validateSpec` for the SDK `ProductProvider`: applies `spec.xp.validation` to open-text values.
 * The SDK runs it only for specs that already pass OrderCloud rules. Module-scoped so it stays
 * referentially stable.
 */
export const validateSpecValue = (
  spec: Spec,
  selection: SpecSelection,
): SpecSelectionIssue<ProductSpecValueIssueCode> | undefined => {
  const options = Array.isArray(spec?.Options) ? spec.Options : [];
  const selectedOption = options.find(
    (option) => option.ID === selection.optionId,
  );
  const acceptsValue =
    (options.length === 0 && spec?.AllowOpenText === true) ||
    selectedOption?.IsOpenText === true;
  const value = selection.value?.trim();

  return acceptsValue && value ? getValueIssue(spec, value) : undefined;
};

/** English messages keyed by issue code (the starter's dictionary for spec validation). */
export const getSpecIssueMessage = (
  issue: SpecSelectionIssue<string>,
  spec?: Spec,
): string => {
  const label = (spec && getSpecPresentation(spec).label) ?? spec?.Name ?? "";
  const params = issue.params ?? {};
  const hasOptions = Array.isArray(spec?.Options) && spec.Options.length > 0;

  switch (issue.code as ProductSpecIssueCode) {
    case "required":
      return hasOptions ? `Select ${label}.` : `Enter ${label}.`;
    case "value-required":
      return `Enter ${label}.`;
    case "invalid-option":
      return `Select a valid ${label}.`;
    case "open-text-not-allowed":
      return `${label} does not accept custom text.`;
    case "spec-unavailable":
      return `${label} is unavailable.`;
    case "variant-unavailable":
      return "This product option combination is unavailable.";
    case "min-length":
      return `${label} must be at least ${params.min} characters.`;
    case "max-length":
      return `${label} must be at most ${params.max} characters.`;
    case "invalid-number":
      return `Enter a valid ${label}.`;
    case "min":
      return `${label} must be at least ${params.min}.`;
    case "max":
      return `${label} must be at most ${params.max}.`;
    case "step":
      return `${label} must use increments of ${params.step}.`;
    case "min-date":
      return `${label} must be on or after ${params.date}.`;
    case "max-date":
      return `${label} must be on or before ${params.date}.`;
    default:
      return label ? `Check ${label}.` : "Check the selected options.";
  }
};

/** Messages for spec-level issues, keyed by spec ID (first issue per spec). */
export const getSpecIssueMessages = (
  issues: SpecSelectionIssue<string>[],
  specs: Spec[],
): Record<string, string> => {
  const messages: Record<string, string> = {};
  for (const issue of issues) {
    if (!issue.specId || messages[issue.specId]) continue;
    const spec = specs.find((candidate) => candidate.ID === issue.specId);
    messages[issue.specId] = getSpecIssueMessage(issue, spec);
  }
  return messages;
};
