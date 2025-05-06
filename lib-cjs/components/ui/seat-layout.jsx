"use strict";
// src/components/ui/seat-layout.tsx
// src/components/ui/seat-layout.tsx
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
exports.DynamicSeatLayout = void 0;
const react_1 = __importStar(require("react"));
const utils_1 = require("@/utils");
const seatsLayout_module_css_1 = __importDefault(require("@/styles/seatsLayout.module.css"));
const image_1 = __importDefault(require("next/image"));
const sonner_1 = require("sonner");
exports.DynamicSeatLayout = react_1.default.memo((0, react_1.forwardRef)(({ title, seats = {}, layout = [], onSeatClick = () => { }, className, isLoading = false, imageUrl, category = 'Bus', }, ref) => {
    if (isLoading)
        return <div className={seatsLayout_module_css_1.default.loading}>Loading seats...</div>;
    if (!layout.length)
        return <div className={seatsLayout_module_css_1.default.error}>No seat layout available</div>;
    const seatNumberToId = new Map();
    Object.values(seats).forEach((seat) => seatNumberToId.set(seat.seatNumber, seat.id));
    const handleSeatClick = (id) => {
        if (process.env.NODE_ENV === 'development')
            console.log('Seat clicked:', id);
        onSeatClick(id);
    };
    return (<div className={(0, utils_1.cn)('mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start', className)} ref={ref}>
                    <div className={(0, utils_1.cn)(seatsLayout_module_css_1.default.matatuContainer)}>
                        <h2 className={seatsLayout_module_css_1.default.title}>{title}</h2>
                        <div className={seatsLayout_module_css_1.default.seatGrid}>
                            {layout.map((row, rowIndex) => (<div key={rowIndex} className={seatsLayout_module_css_1.default.seatRow}>
                                    {row.map((group, groupIndex) => (<react_1.default.Fragment key={groupIndex}>
                                            {group.map((seatNumber) => {
                    const seatId = seatNumberToId.get(seatNumber);
                    if (seatId === undefined) {
                        return (<div key={seatNumber} className={(0, utils_1.cn)(seatsLayout_module_css_1.default.seat, seatsLayout_module_css_1.default.unavailable)} aria-label={`Seat ${seatNumber} - unavailable`}>
                                                            {seatNumber}
                                                        </div>);
                    }
                    const seat = seats[seatId];
                    return (<div key={seatNumber} data-seat-id={seatId} className={(0, utils_1.cn)(seatsLayout_module_css_1.default.seat, seat?.status ? seatsLayout_module_css_1.default[seat.status] : seatsLayout_module_css_1.default.available, seat?.status === 'reserved' && 'pointer-events-none')} onClick={() => seat?.status !== 'reserved' && handleSeatClick(seatId)} onKeyDown={(e) => seat?.status !== 'reserved' &&
                            (e.key === 'Enter' || e.key === ' ') &&
                            (e.preventDefault(), handleSeatClick(seatId))} role="button" tabIndex={seat?.status === 'reserved' ? -1 : 0} aria-label={`Seat ${seat?.seatNumber || seatNumber} - ${seat?.status || 'available'}`} aria-disabled={seat?.status === 'reserved'} aria-selected={seat?.status === 'selected'}>
                                                        {seat?.seatNumber || seatNumber}
                                                    </div>);
                })}
                                            {groupIndex < row.length - 1 && <div className={seatsLayout_module_css_1.default.aisleSpace}/>}
                                        </react_1.default.Fragment>))}
                                </div>))}
                        </div>
                        <div className={seatsLayout_module_css_1.default.legend}>
                            {['available', 'selected', 'reserved'].map((status) => (<div key={status} className={seatsLayout_module_css_1.default.legendItem}>
                                    <div className={(0, utils_1.cn)(seatsLayout_module_css_1.default.seat, seatsLayout_module_css_1.default[status])} aria-hidden="true"/>
                                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                </div>))}
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        {imageUrl ? (<image_1.default src={imageUrl} alt={category} width={192} height={192} className="object-cover rounded-md" placeholder="blur" blurDataURL="/placeholder.jpg" priority={false} onLoadingComplete={() => console.log(`Loaded image for ${category}`)} onError={() => sonner_1.toast.error(`Failed to load image for ${category}`)}/>) : (<p className="text-gray-400 text-center">No image available for this bus</p>)}
                    </div>
                </div>);
}), (prevProps, nextProps) => prevProps.seats === nextProps.seats &&
    prevProps.layout === nextProps.layout &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.category === nextProps.category);
exports.DynamicSeatLayout.displayName = 'DynamicSeatLayout';
