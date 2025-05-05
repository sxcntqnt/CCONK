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
exports.MapComponent = void 0;
const react_1 = __importStar(require("react"));
const maplibre_gl_1 = __importDefault(require("maplibre-gl"));
const maplibre_gl_draw_1 = __importDefault(require("maplibre-gl-draw"));
require("maplibre-gl/dist/maplibre-gl.css");
const GeofenceMap_1 = require("./GeofenceMap");
const MapComponent = ({ onMapLoad, onDrawCreate, onDrawUpdate, onDrawDelete, mapRef, drawRef, }) => {
    const mapContainer = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!mapContainer.current)
            return;
        mapRef.current = new maplibre_gl_1.default.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    'osm-tiles': {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm-tiles',
                        type: 'raster',
                        source: 'osm-tiles',
                    },
                ],
            },
            center: [-1.36876, 36.33421],
            zoom: 13,
        });
        mapRef.current.addControl(new maplibre_gl_1.default.NavigationControl(), 'bottom-right');
        drawRef.current = new maplibre_gl_draw_1.default({
            displayControlsDefault: false,
            controls: {
                polygon: false,
                trash: false,
            },
            modes: {
                ...maplibre_gl_draw_1.default.modes,
                draw_rectangle: GeofenceMap_1.RectangleMode,
            },
        });
        mapRef.current.addControl(drawRef.current, 'top-right');
        mapRef.current.on('load', onMapLoad);
        mapRef.current.on('draw.create', onDrawCreate);
        mapRef.current.on('draw.update', onDrawUpdate);
        mapRef.current.on('draw.delete', onDrawDelete);
        return () => {
            mapRef.current?.remove();
        };
    }, [onMapLoad, onDrawCreate, onDrawUpdate, onDrawDelete, mapRef, drawRef]);
    return (<div className="w-full h-full relative">
      <div ref={mapContainer} className="h-full w-full"/>
    </div>);
};
exports.MapComponent = MapComponent;
