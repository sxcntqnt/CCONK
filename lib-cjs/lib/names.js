"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFetch = exports.fetchAPI = exports.sortTrips = exports.generateUniqueName = void 0;
exports.formatTime = formatTime;
exports.formatDate = formatDate;
exports.formatTimeOfDay = formatTimeOfDay;
const unique_names_generator_1 = require("unique-names-generator");
const react_1 = require("react");
const generateUniqueName = () => {
    const customConfig = {
        dictionaries: [unique_names_generator_1.colors, unique_names_generator_1.animals, unique_names_generator_1.starWars],
        separator: ' ',
        style: 'capital',
    };
    return (0, unique_names_generator_1.uniqueNamesGenerator)(customConfig);
};
exports.generateUniqueName = generateUniqueName;
const sortTrips = (trips) => {
    return trips.sort((a, b) => {
        const dateA = new Date(`${a.createdAt.split('T')[0]}T${a.departureTime.split('T')[1] || a.departureTime}`);
        const dateB = new Date(`${b.createdAt.split('T')[0]}T${b.departureTime.split('T')[1] || b.departureTime}`);
        return dateB.getTime() - dateA.getTime();
    });
};
exports.sortTrips = sortTrips;
function formatTime(minutes) {
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
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day < 10 ? "0" + day : day} ${month} ${year}`;
}
function formatTimeOfDay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
const fetchAPI = async (url, options) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
exports.fetchAPI = fetchAPI;
const useFetch = (url, options) => {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchData = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await (0, exports.fetchAPI)(url, options);
            setData(result.data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [url, options]);
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [fetchData]);
    return { data, loading, error, refetch: fetchData };
};
exports.useFetch = useFetch;
