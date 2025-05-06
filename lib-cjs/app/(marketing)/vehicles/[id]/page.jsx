"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VehicleDetailsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const dbClient_1 = require("@/lib/prisma/dbClient");
const matatuSeats_1 = require("@/utils/constants/matatuSeats");
const card_1 = require("@/components/ui/card");
const vehicleImagesCarousel_1 = __importDefault(require("@/components/ui/vehicleImagesCarousel"));
function VehicleDetailsPage({ params }) {
    const busId = parseInt(params.id, 10);
    const router = (0, navigation_1.useRouter)();
    const [bus, setBus] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const cardRef = (0, react_1.useRef)(null);
    // Fetch bus data client-side
    (0, react_1.useEffect)(() => {
        if (isNaN(busId)) {
            setError('Invalid bus ID');
            return;
        }
        async function fetchBus() {
            try {
                const busData = await (0, dbClient_1.getBus)(busId);
                if (!busData) {
                    setError('Bus not found');
                }
                else {
                    setBus(busData);
                }
            }
            catch (err) {
                console.error('Error fetching bus details:', err);
                setError('Failed to load bus details');
            }
        }
        fetchBus();
    }, [busId]);
    // Keyboard navigation
    const handleKeyDown = (0, react_1.useCallback)((event) => {
        if (event.ctrlKey && event.key === 'c') {
            // Focus the carousel
            event.preventDefault();
            const carousel = cardRef.current?.querySelector('.carousel-container');
            if (carousel instanceof HTMLElement) {
                carousel.focus();
            }
        }
        else if (event.key === 'Escape') {
            // Navigate back
            router.back();
        }
    }, [router]);
    // Window resize handling
    const handleResize = (0, react_1.useCallback)(() => {
        if (cardRef.current) {
            // Adjust card width (e.g., 90% on mobile, 75% on desktop)
            const width = window.innerWidth < 768 ? '90%' : '75%';
            cardRef.current.style.width = width;
            cardRef.current.style.margin = '0 auto';
        }
    }, []);
    // Scroll-based visibility
    const handleScroll = (0, react_1.useCallback)(() => {
        if (!cardRef.current)
            return;
        const rect = cardRef.current.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        cardRef.current.style.opacity = isVisible ? '1' : '0.8';
    }, []);
    // Add and clean up event listeners
    (0, react_1.useEffect)(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);
        // Initial calls
        handleResize();
        handleScroll();
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleKeyDown, handleResize, handleScroll]);
    if (error) {
        return (<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <p className="text-red-400">{error}</p>
            </div>);
    }
    if (!bus) {
        return (<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <p>Loading...</p>
            </div>);
    }
    const busCapacity = bus.capacity;
    const config = matatuSeats_1.matatuConfigs[busCapacity];
    return (<div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <card_1.Card className="bg-gray-800 border-gray-700 rounded-lg vehicle-details-card" ref={cardRef} aria-label={`Details for ${bus.licensePlate}`}>
                    <card_1.CardHeader>
                        <card_1.CardTitle className="text-2xl font-bold">{config.title}</card_1.CardTitle>
                        <p className="text-sm text-gray-300">Category: {bus.category}</p>
                    </card_1.CardHeader>
                    <card_1.CardContent>
                        <vehicleImagesCarousel_1.default images={bus.images} licensePlate={bus.licensePlate} className="carousel-container"/>
                    </card_1.CardContent>
                </card_1.Card>
            </div>
        </div>);
}
