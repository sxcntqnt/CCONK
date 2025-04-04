// src/utils/functions/tests.ts
import { cn } from './cn';
import { generateMetadata } from './metadata';
import { isValidUrl, getUrlFromText, getSearchParams } from './urls';

// Import necessary modules for testing
import { describe, test, expect } from '@jest/globals';
import { Metadata } from 'next'; // Import Next.js Metadata type

// Tests for cn function
describe('cn', () => {
    test('combines class names correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    test('handles conditional classes', () => {
        expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });

    test('removes duplicate classes', () => {
        expect(cn('class1', 'class1', 'class2')).toBe('class1 class2');
    });
});

// Tests for generateMetadata function
describe('generateMetadata', () => {
    test('returns default metadata when no arguments are provided', () => {
        const metadata = generateMetadata({});
        expect(metadata.title).toContain(process.env.NEXT_PUBLIC_APP_NAME);
        expect(metadata.description).toContain(process.env.NEXT_PUBLIC_APP_NAME);
        expect(metadata.icons).toHaveLength(3);
    });

    test('overrides default values correctly', () => {
        const metadata = generateMetadata({
            title: 'Custom Title',
            description: 'Custom Description',
            image: 'https://example.com/image.png',
            noIndex: true,
        }) as Metadata & { openGraph?: { images?: Array<{ url: string }> } }; // Extend type for test

        expect(metadata.title).toBe('Custom Title');
        expect(metadata.description).toBe('Custom Description');
        // Safely access images array with type assertion
        expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/image.png');
        expect(metadata.robots).toEqual({ index: false, follow: false });
    });
});

// Tests for isValidUrl function
describe('isValidUrl', () => {
    test('returns true for valid URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('returns false for invalid URLs', () => {
        expect(isValidUrl('invalid-url')).toBe(false);
        expect(isValidUrl('')).toBe(false);
    });
});

// Tests for getUrlFromText function
describe('getUrlFromText', () => {
    test('returns input if it is a valid URL', () => {
        expect(getUrlFromText('https://example.com')).toBe('https://example.com');
    });

    test('constructs a valid URL when given a domain-like string', () => {
        expect(getUrlFromText('example.com')).toBe('https://example.com');
    });

    test('returns an empty string for invalid input', () => {
        expect(getUrlFromText('invalid text')).toBe('');
    });
});

// Tests for getSearchParams function
describe('getSearchParams', () => {
    test('extracts query parameters correctly', () => {
        const params = getSearchParams('https://example.com?foo=bar&baz=qux');
        expect(params).toEqual({ foo: 'bar', baz: 'qux' });
    });

    test('returns an empty object when no query parameters exist', () => {
        const params = getSearchParams('https://example.com');
        expect(params).toEqual({});
    });
});
