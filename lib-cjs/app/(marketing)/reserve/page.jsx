"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReservePage;
const react_1 = __importStar(require("react"));
const nextjs_1 = require("@clerk/nextjs");
const useReservation_1 = __importDefault(require("@/hooks/useReservation"));
const matatuSeats_1 = require("@/utils/constants/matatuSeats");
const seat_layout_1 = require("@/components/ui/seat-layout");
const components_1 = require("@/components");
const button_1 = require("@/components/ui/button");
const lamp_1 = require("@/components/ui/lamp");
const magic_badge_1 = __importDefault(require("@/components/ui/magic-badge"));
const card_1 = require("@/components/ui/card");
const separator_1 = require("@/components/ui/separator");
const scroll_area_1 = require("@/components/ui/scroll-area");
const dialog_1 = require("@/components/ui/dialog");
const select_1 = require("@/components/ui/select");
const input_1 = require("@/components/ui/input");
const lucide_react_1 = require("lucide-react");
const sonner_1 = require("sonner");
const PhonNumberForm_1 = __importDefault(require("@/components/ui/PhonNumberForm"));
const image_1 = __importDefault(require("next/image"));
const pagination_1 = require("@/components/ui/pagination");
const utils_1 = require("@/utils");
const components_2 = require("@/components");
/**
 * Component to display the selected bus image
 */
const BusImageDisplay = ({ imageUrl, category, isLoading, }) => {
    if (!imageUrl) {
        return <p className="text-gray-400 text-center">No image available for this bus</p>;
    }
    return (<div className="flex justify-center">
            <image_1.default src={imageUrl} alt={category} width={192} height={192} className="object-cover rounded-md" placeholder="blur" blurDataURL="/placeholder.jpg" priority={false} onLoadingComplete={() => console.log(`Loaded image for ${category}`)} onError={() => sonner_1.toast.error(`Failed to load image for ${category}`)}/>
        </div>);
};
/**
 * Main ReservePage component
 */
function ReservePage() {
    const { user, isLoaded: userLoaded } = (0, nextjs_1.useUser)();
    const clerkId = user?.id ?? null; // Safely handle undefined user
    const { buses, selectedBusId, seats, selectedSeats, total, phoneNumber, isPhoneValid, isLoading, error, paymentSuccess, paymentError, setPhoneNumber, handleBusChange, handleSeatClick, handleCheckout, confirmCheckout, handleReset, handleNextPage, handlePrevPage, selectedCapacity, handleCapacityChange, licensePlateFilter, handleLicensePlateChange, currentPage, totalPages, isCheckoutModalOpen, setIsCheckoutModalOpen, } = (0, useReservation_1.default)();
    const modalRef = (0, react_1.useRef)(null);
    const seatContainerRef = (0, react_1.useRef)(null);
    const [windowWidth, setWindowWidth] = react_1.default.useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    // Handle keyboard navigation for seat selection
    const handleKeyDown = (0, react_1.useCallback)((event) => {
        if (!seatContainerRef.current || isLoading || !selectedBusId)
            return;
        const seatElements = seatContainerRef.current.querySelectorAll('[data-seat-id]');
        const currentIndex = Array.from(seatElements).findIndex((el) => el === document.activeElement);
        let newIndex = currentIndex;
        if (event.key === 'ArrowRight') {
            newIndex = Math.min(currentIndex + 1, seatElements.length - 1);
        }
        else if (event.key === 'ArrowLeft') {
            newIndex = Math.max(currentIndex - 1, 0);
        }
        else if (event.key === 'Enter' && currentIndex >= 0) {
            const seatId = seatElements[currentIndex].getAttribute('data-seat-id');
            if (seatId)
                handleSeatClick(seatId);
        }
        if (newIndex !== currentIndex && seatElements[newIndex]) {
            seatElements[newIndex].focus();
        }
    }, [handleSeatClick, isLoading, selectedBusId]);
    // Handle click outside modal to close
    const handleClickOutside = (0, react_1.useCallback)((event) => {
        if (modalRef.current &&
            !modalRef.current.contains(event.target) &&
            isCheckoutModalOpen &&
            !isLoading &&
            !paymentSuccess) {
            setIsCheckoutModalOpen(false);
        }
    }, [isCheckoutModalOpen, isLoading, paymentSuccess, setIsCheckoutModalOpen]);
    // Handle window resize for responsive layout
    const handleResize = (0, react_1.useCallback)(() => {
        setWindowWidth(window.innerWidth);
        if (seatContainerRef.current) {
            const scale = window.innerWidth < 768 ? 0.8 : 1;
            seatContainerRef.current.style.transform = `scale(${scale})`;
        }
    }, []);
    // Add and clean up event listeners
    (0, react_1.useEffect)(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);
        // Initial resize call
        handleResize();
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, [handleKeyDown, handleClickOutside, handleResize]);
    // Scroll event for sticky headers or animations
    (0, react_1.useEffect)(() => {
        const handleScroll = () => {
            const header = document.querySelector('.reservation-header');
            if (header) {
                const isSticky = window.scrollY > 100;
                header.classList.toggle('sticky', isSticky);
                header.classList.toggle('shadow-lg', isSticky);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const selectedBus = buses.find((bus) => bus.id === selectedBusId) || {
        id: 0,
        licensePlate: 'N/A',
        capacity: '14',
        category: 'N/A',
        imageUrl: '',
    };
    const busCapacity = selectedBus.capacity;
    const layout = matatuSeats_1.matatuConfigs[busCapacity]?.layout || matatuSeats_1.matatuConfigs['14'].layout;
    const seatsForLayout = Object.fromEntries(Object.entries(seats).map(([id, seat]) => [
        parseInt(id, 10),
        {
            id: parseInt(id, 10),
            busId: selectedBusId || 0,
            seatNumber: parseInt(seat.label, 10) || 0,
            price: seat.price || 0,
            row: seat.row || 0,
            column: seat.column || 0,
            status: seat.status || 'available',
        },
    ]));
    const seatCount = Object.keys(seatsForLayout).length;
    (0, react_1.useEffect)(() => {
        if (paymentSuccess) {
            sonner_1.toast.success(<div className="flex items-center gap-2">
                    <lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500"/>
                    <span>Payment successful! Your seats are reserved.</span>
                </div>, {
                duration: 5000,
                style: {
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.5)',
                    color: '#fff',
                },
            });
        }
        else if (paymentError) {
            sonner_1.toast.error(<div className="flex items-center gap-2">
                    <lucide_react_1.AlertCircle className="h-5 w-5 text-red-500"/>
                    <span>{paymentError}</span>
                </div>, {
                duration: 5000,
                style: {
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#fff',
                },
            });
        }
    }, [paymentSuccess, paymentError]);
    const handleConfirmCheckout = () => {
        if (!clerkId) {
            sonner_1.toast.error('Please sign in to complete your reservation');
            return;
        }
        confirmCheckout(clerkId);
    };
    // Show loading state while Clerk user data is loading
    if (!userLoaded) {
        return (<components_2.ErrorBoundary>
                <components_1.MaxWidthWrapper className="flex items-center justify-center min-h-screen">
                    <div className="text-white">Loading reservation...</div>
                </components_1.MaxWidthWrapper>
            </components_2.ErrorBoundary>);
    }
    return (<components_2.ErrorBoundary>
            <components_1.MaxWidthWrapper className="py-6">
                <lamp_1.LampContainer>
                    <components_1.AnimationContainer>
                        <h1 className="text-4xl font-bold text-white text-center mb-4">Reserve Your Seat</h1>
                        <magic_badge_1.default>Book your ride in style!</magic_badge_1.default>
                    </components_1.AnimationContainer>
                </lamp_1.LampContainer>

                {error && !paymentSuccess && <ErrorMessage message={error.message || 'An error occurred'}/>}

                {selectedBusId && seatCount > 0 && layout.length > 0 ? (<div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                            <seat_layout_1.DynamicSeatLayout ref={seatContainerRef} title={selectedBus.category} seats={seatsForLayout} layout={layout} onSeatClick={(id) => handleSeatClick(id.toString())} isLoading={isLoading} className="mt-2"/>
                            <p className="text-gray-300 text-center mt-1">Seats: {seatCount}</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <BusImageDisplay imageUrl={selectedBus.imageUrl} category={selectedBus.category} isLoading={isLoading}/>
                        </div>
                    </div>) : (<p className="text-gray-400 text-center mb-6">
                        {buses.length === 0
                ? 'No buses available for the selected filters'
                : 'Select a bus to view seat layout'}
                    </p>)}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <BusSelectionCard buses={buses} selectedBusId={selectedBusId} handleBusChange={handleBusChange} selectedBus={selectedBus} isLoading={isLoading} currentPage={currentPage} totalPages={totalPages} handleNextPage={handleNextPage} handlePrevPage={handlePrevPage} selectedCapacity={selectedCapacity} handleCapacityChange={handleCapacityChange} licensePlateFilter={licensePlateFilter} handleLicensePlateChange={handleLicensePlateChange}/>
                    <BookingSummaryCard selectedSeats={selectedSeats} seats={seats} total={total} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} handleCheckout={handleCheckout} handleReset={handleReset} handleSeatClick={handleSeatClick} isLoading={isLoading} isPhoneValid={isPhoneValid} error={error}/>
                </div>

                <dialog_1.Dialog open={isCheckoutModalOpen} onOpenChange={(isOpen) => {
            if (!isLoading) {
                setIsCheckoutModalOpen(isOpen);
                if (!isOpen && paymentSuccess) {
                    handleReset();
                }
            }
        }}>
                    <dialog_1.DialogContent ref={modalRef} className="bg-gray-900 text-white border-none">
                        <dialog_1.DialogHeader>
                            <dialog_1.DialogTitle>Confirm Your Reservation</dialog_1.DialogTitle>
                        </dialog_1.DialogHeader>
                        <div className="py-4">
                            <p>Please review your reservation details:</p>
                            <ul className="mt-2 space-y-2">
                                <li>
                                    Bus: {selectedBus.category} ({selectedBus.licensePlate})
                                </li>
                                <li>Seats: {selectedSeats.map((id) => seats[id]?.label || id).join(', ') || 'None'}</li>
                                <li>Total: {total}/=</li>
                                <li>Phone: {phoneNumber}</li>
                            </ul>
                            {paymentSuccess && (<p className="mt-4 text-green-500 flex items-center gap-2">
                                    <lucide_react_1.CheckCircle2 className="h-5 w-5"/>
                                    Payment confirmed successfully!
                                </p>)}
                            {paymentError && (<p className="mt-4 text-red-500 flex items-center gap-2">
                                    <lucide_react_1.AlertCircle className="h-5 w-5"/>
                                    {paymentError}
                                </p>)}
                        </div>
                        <dialog_1.DialogFooter className="flex justify-end gap-4">
                            <button_1.Button variant="outline" onClick={() => setIsCheckoutModalOpen(false)} disabled={isLoading} className="text-white border-gray-700 w-24">
                                {paymentSuccess ? 'Close' : 'Cancel'}
                            </button_1.Button>
                            {!paymentSuccess && (<button_1.Button onClick={handleConfirmCheckout} disabled={isLoading || total === 0 || !clerkId} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-48">
                                    {isLoading ? 'Processing...' : 'Confirm'}
                                </button_1.Button>)}
                        </dialog_1.DialogFooter>
                    </dialog_1.DialogContent>
                </dialog_1.Dialog>
            </components_1.MaxWidthWrapper>
        </components_2.ErrorBoundary>);
}
const BookingSummaryCard = ({ selectedSeats, seats, total, phoneNumber, setPhoneNumber, handleCheckout, handleReset, handleSeatClick, isLoading, isPhoneValid, error, }) => {
    return (<card_1.Card className="bg-gray-900 text-white border-none shadow-lg">
            <card_1.CardHeader>
                <card_1.CardTitle className="text-2xl">Reservation Summary</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">Selected Seats:</span>
                    <magic_badge_1.default>{selectedSeats.length.toString()}</magic_badge_1.default>
                </div>
                <scroll_area_1.ScrollArea className="h-40 mb-4">
                    {selectedSeats.length > 0 ? (selectedSeats.map((id) => (<div key={id} className="flex justify-between items-center py-2">
                                <span>Seat #{seats[id]?.label || id}</span>
                                <div className="flex items-center gap-2">
                                    <span>{seats[id]?.price || 0}/=</span>
                                    <button_1.Button variant="ghost" size="sm" onClick={() => handleSeatClick(id)} disabled={isLoading}>
                                        Cancel
                                    </button_1.Button>
                                </div>
                            </div>))) : (<p className="text-gray-400">No seats selected yet.</p>)}
                </scroll_area_1.ScrollArea>
                <separator_1.Separator className="my-4 bg-gray-700"/>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">Total:</span>
                    <span className="text-xl font-bold">{total}/=</span>
                </div>
                <div className="mb-6">
                    <PhonNumberForm_1.default onValidSubmit={setPhoneNumber} defaultPhone={phoneNumber} isLoading={isLoading}/>
                </div>
                <div className="flex gap-4">
                    <button_1.Button onClick={handleCheckout} disabled={isLoading || selectedSeats.length === 0 || !isPhoneValid || total < 20} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                        {isLoading ? 'Processing...' : 'Checkout'}
                    </button_1.Button>
                    <button_1.Button onClick={handleReset} variant="destructive" disabled={isLoading} className="flex-1">
                        Reset
                    </button_1.Button>
                </div>
            </card_1.CardContent>
        </card_1.Card>);
};
const BusSelectionCard = ({ buses, selectedBusId, handleBusChange, selectedBus, isLoading, currentPage, totalPages, handleNextPage, handlePrevPage, selectedCapacity, handleCapacityChange, licensePlateFilter, handleLicensePlateChange, }) => {
    return (<card_1.Card className="bg-gray-900 text-white border-none shadow-lg">
            <card_1.CardHeader>
                <card_1.CardTitle className="text-2xl flex items-center gap-2">Select Your Bus</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
                <div className="mb-4">
                    <label htmlFor="capacitySelect" className="text-sm text-gray-300">
                        Filter by Capacity
                    </label>
                    <select_1.Select value={selectedCapacity} onValueChange={handleCapacityChange} disabled={isLoading}>
                        <select_1.SelectTrigger id="capacitySelect" className="mt-1 bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-blue-500">
                            <select_1.SelectValue placeholder="Select capacity"/>
                        </select_1.SelectTrigger>
                        <select_1.SelectContent className="bg-gray-800 text-white border-gray-700">
                            <select_1.SelectItem value="all">All Capacities</select_1.SelectItem>
                            {Object.keys(matatuSeats_1.matatuConfigs).map((capacity) => (<select_1.SelectItem key={capacity} value={capacity}>
                                    {matatuSeats_1.matatuConfigs[capacity].title}
                                </select_1.SelectItem>))}
                        </select_1.SelectContent>
                    </select_1.Select>
                </div>
                <div className="mb-4">
                    <label htmlFor="licensePlateInput" className="text-sm text-gray-300">
                        Search by License Plate
                    </label>
                    <input_1.Input id="licensePlateInput" value={licensePlateFilter} onChange={(e) => handleLicensePlateChange(e.target.value)} placeholder="Enter license plate (e.g., KAA 123B)" disabled={isLoading} className="mt-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500"/>
                    <button_1.Button variant="outline" onClick={() => {
            handleCapacityChange('all');
            handleLicensePlateChange('');
        }} disabled={isLoading} className="mt-2 text-white border-gray-700 hover:bg-gray-800 w-full">
                        Clear Filters
                    </button_1.Button>
                </div>
                <div className="mb-4">
                    <label htmlFor="busSelect" className="text-sm text-gray-300">
                        Select Bus
                    </label>
                    <select id="busSelect" value={selectedBusId || ''} onChange={(e) => handleBusChange(parseInt(e.target.value, 10))} disabled={isLoading || buses.length === 0} className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                        {buses.length === 0 && <option value="">No buses available</option>}
                        {buses.map((bus) => (<option key={bus.id} value={bus.id}>
                                {bus.category} ({bus.licensePlate})
                            </option>))}
                    </select>
                </div>
                <pagination_1.Pagination>
                    <pagination_1.PaginationContent>
                        <pagination_1.PaginationItem>
                            <pagination_1.PaginationPrevious onClick={handlePrevPage} href="#" className={(0, utils_1.cn)(currentPage === 1 || isLoading ? 'pointer-events-none opacity-50' : '')}/>
                        </pagination_1.PaginationItem>
                        <pagination_1.PaginationItem>
                            <span className="text-gray-300 px-4">
                                Page {currentPage} of {totalPages}
                            </span>
                        </pagination_1.PaginationItem>
                        <pagination_1.PaginationItem>
                            <pagination_1.PaginationNext onClick={handleNextPage} href="#" className={(0, utils_1.cn)(currentPage === totalPages || isLoading ? 'pointer-events-none opacity-50' : '')}/>
                        </pagination_1.PaginationItem>
                    </pagination_1.PaginationContent>
                </pagination_1.Pagination>
            </card_1.CardContent>
        </card_1.Card>);
};
/**
 * ErrorMessage component for displaying error messages
 */
const ErrorMessage = ({ message }) => (<div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md mb-4 flex items-center gap-2">
        <lucide_react_1.AlertCircle className="h-5 w-5"/>
        <span>{message}</span>
    </div>);
