import { describe, expect, it } from 'vitest';
import type { Spec } from '@sitecore-content-sdk/nextjs/commerce';
import {
  getSpecIssueMessage,
  getSpecIssueMessages,
  toCommerceProductSpec,
  validateSpecValue,
} from '../lib/commerce/products/specs';

const sizeSpec: Spec = {
  ID: 'SIZE',
  Name: 'Size',
  Required: true,
  DefinesVariant: true,
  Options: [
    { ID: 'SMALL', Value: 'Small' },
    { ID: 'OTHER', Value: 'Other', IsOpenText: true },
  ],
};

const messageSpec = (xp: Record<string, unknown>): Spec => ({
  ID: 'MESSAGE',
  Name: 'Message',
  Required: true,
  AllowOpenText: true,
  Options: [],
  xp,
});

describe('product spec presentation', () => {
  it('normalizes supported Spec and Option XP presentation', () => {
    expect(
      toCommerceProductSpec({
        ID: 'COLOR',
        Name: 'Color',
        Required: true,
        xp: {
          presentation: {
            control: 'swatches',
            label: 'Finish',
            helpText: 'Choose a finish',
          },
        },
        Options: [
          {
            ID: 'NAVY',
            Value: 'Navy',
            PriceMarkupType: 'Percentage',
            PriceMarkup: 5,
            xp: {
              presentation: {
                label: 'Midnight navy',
                color: '#1e3a5f',
                imageUrl: 'https://example.com/navy.jpg',
                badge: 'Popular',
              },
            },
          },
        ],
      }),
    ).toMatchObject({
      required: true,
      presentation: {
        control: 'swatches',
        label: 'Finish',
        helpText: 'Choose a finish',
      },
      options: [
        {
          priceMarkupType: 'Percentage',
          priceMarkup: 5,
          presentation: {
            label: 'Midnight navy',
            color: '#1e3a5f',
            imageUrl: 'https://example.com/navy.jpg',
            badge: 'Popular',
          },
        },
      ],
    });
  });

  it('falls back safely when presentation XP is unsupported', () => {
    expect(
      toCommerceProductSpec({
        ID: 'COLOR',
        Name: 'Color',
        xp: { presentation: { control: 'carousel' } },
        Options: [
          {
            ID: 'RED',
            Value: 'Red',
            xp: {
              presentation: {
                color: 'url(javascript:bad)',
                imageUrl: 'javascript:bad',
              },
            },
          },
        ],
      }),
    ).toMatchObject({
      presentation: { control: undefined },
      options: [{ presentation: { color: undefined, imageUrl: undefined } }],
    });
  });

  it('skips specs without an ID or name', () => {
    expect(toCommerceProductSpec({ ID: ' ', Name: 'Size' })).toBeUndefined();
  });
});

describe('validateSpecValue (xp constraints)', () => {
  it('validates configured open-text length constraints', () => {
    const spec = messageSpec({
      presentation: { textControl: 'text' },
      validation: { minLength: 3, maxLength: 8 },
    });

    expect(validateSpecValue(spec, { value: 'Hi' })).toEqual({
      specId: 'MESSAGE',
      code: 'min-length',
      params: { min: 3 },
    });
    expect(validateSpecValue(spec, { value: 'Welcome' })).toBeUndefined();
    expect(validateSpecValue(spec, { value: 'Welcome back' })).toMatchObject({
      code: 'max-length',
    });
  });

  it('validates number constraints', () => {
    const spec = messageSpec({
      presentation: { textControl: 'number' },
      validation: { min: 2, max: 10, step: 2 },
    });

    expect(validateSpecValue(spec, { value: 'abc' })).toMatchObject({ code: 'invalid-number' });
    expect(validateSpecValue(spec, { value: '1' })).toMatchObject({ code: 'min' });
    expect(validateSpecValue(spec, { value: '12' })).toMatchObject({ code: 'max' });
    expect(validateSpecValue(spec, { value: '5' })).toMatchObject({
      code: 'step',
      params: { step: 2 },
    });
    expect(validateSpecValue(spec, { value: '6' })).toBeUndefined();
  });

  it('validates date constraints', () => {
    const spec = messageSpec({
      presentation: { textControl: 'date' },
      validation: { minDate: '2026-01-01', maxDate: '2026-12-31' },
    });

    expect(validateSpecValue(spec, { value: '2025-12-31' })).toMatchObject({
      code: 'min-date',
      params: { date: '2026-01-01' },
    });
    expect(validateSpecValue(spec, { value: '2027-01-01' })).toMatchObject({ code: 'max-date' });
    expect(validateSpecValue(spec, { value: '2026-06-01' })).toBeUndefined();
  });

  it('only checks values that the spec or selected option accepts', () => {
    const constrained: Spec = {
      ...sizeSpec,
      xp: { validation: { minLength: 5 } },
    };

    expect(validateSpecValue(constrained, { optionId: 'SMALL' })).toBeUndefined();
    expect(validateSpecValue(constrained, { optionId: 'OTHER', value: 'abc' })).toMatchObject({
      code: 'min-length',
    });
    expect(validateSpecValue(messageSpec({ validation: { minLength: 3 } }), { value: '  ' })).toBeUndefined();
  });
});

describe('spec issue messages', () => {
  it('maps SDK issue codes to English messages using the presentation label', () => {
    const labelled: Spec = { ...sizeSpec, xp: { presentation: { label: 'Shoe size' } } };

    expect(getSpecIssueMessage({ specId: 'SIZE', code: 'required' }, labelled)).toBe(
      'Select Shoe size.',
    );
    expect(getSpecIssueMessage({ specId: 'MESSAGE', code: 'required' }, messageSpec({}))).toBe(
      'Enter Message.',
    );
    expect(getSpecIssueMessage({ specId: 'SIZE', code: 'value-required' }, sizeSpec)).toBe(
      'Enter Size.',
    );
    expect(getSpecIssueMessage({ specId: '', code: 'variant-unavailable' })).toBe(
      'This product option combination is unavailable.',
    );
    expect(
      getSpecIssueMessage(
        { specId: 'MESSAGE', code: 'min-length', params: { min: 3 } },
        messageSpec({}),
      ),
    ).toBe('Message must be at least 3 characters.');
  });

  it('keys the first message per spec and skips product-level issues', () => {
    expect(
      getSpecIssueMessages(
        [
          { specId: 'SIZE', code: 'required' },
          { specId: 'SIZE', code: 'invalid-option' },
          { specId: '', code: 'variant-unavailable' },
        ],
        [sizeSpec],
      ),
    ).toEqual({ SIZE: 'Select Size.' });
  });
});
