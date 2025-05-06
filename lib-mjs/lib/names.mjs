"use client";
import { colors, animals, starWars, uniqueNamesGenerator } from 'unique-names-generator';
import { useState, useEffect, useCallback } from 'react';
export const generateUniqueName = () => {
    const customConfig = {
        dictionaries: [colors, animals, starWars],
        separator: ' ',
        style: 'capital',
    };
    return uniqueNamesGenerator(customConfig);
};
export const sortTrips = (trips) => {
    return trips.sort((a, b) => {
        const dateA = new Date(`${a.createdAt.split('T')[0]}T${a.departureTime.split('T')[1] || a.departureTime}`);
        const dateB = new Date(`${b.createdAt.split('T')[0]}T${b.departureTime.split('T')[1] || b.departureTime}`);
        return dateB.getTime() - dateA.getTime();
    });
};
export function formatTime(minutes) {
    const formattedMinutes = +minutes?.toFixed(0) || 0;
    if (formattedMinutes < 60) {
        return `${minutes} min`;
    }
    else {
        const hours = Math.floor(formattedMinutes / 60);
        const remainingMinutes = formattedMinutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
}
export function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day < 10 ? '0' + day : day} ${month} ${year}`;
}
export function formatTimeOfDay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
export const fetchAPI = async (url, options) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};
export const useFetch = (url, options) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchAPI(url, options);
            setData(result.data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [url, options]);
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    return { data, loading, error, refetch: fetchData };
};
