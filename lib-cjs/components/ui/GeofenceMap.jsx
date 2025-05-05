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
exports.RectangleMode = void 0;
const react_1 = __importStar(require("react"));
require("maplibre-gl/dist/maplibre-gl.css");
const GeofenceControls_1 = __importDefault(require("./GeofenceControls"));
const MapComponent_1 = require("./MapComponent");
exports.RectangleMode = {
    onSetup(options) {
        this.clearSelectedFeatures();
        this.setActionableState({ trash: true, combineFeatures: false, uncombineFeatures: false });
        return { startPoint: null };
    },
    onClick(state, e) {
        if (!state.startPoint) {
            state.startPoint = e.lngLat;
            return;
        }
        const endPoint = e.lngLat;
        const coordinates = [
            [state.startPoint.lng, state.startPoint.lat],
            [state.startPoint.lng, endPoint.lat],
            [endPoint.lng, endPoint.lat],
            [endPoint.lng, state.startPoint.lat],
            [state.startPoint.lng, state.startPoint.lat],
        ];
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates],
            },
            properties: {},
            id: Date.now(),
        };
        this.map.fire('draw.create', { features: [feature] });
        this.changeMode('simple_select');
    },
    toDisplayFeatures(state, geojson, display) {
        display(geojson);
    },
};
const GeofenceMap = () => {
    const [geofences, setGeofences] = (0, react_1.useState)([]);
    const [activeGeofence, setActiveGeofence] = (0, react_1.useState)(null);
    const [editMode, setEditMode] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const mapRef = (0, react_1.useRef)(null);
    const draw = (0, react_1.useRef)(null);
    const colorPalette = ['#FF5F6D', '#47B881', '#4299E1', '#FFC107', '#9F7AEA', '#ED64A6'];
    const getRandomColor = () => colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const handleMapLoad = () => {
        setIsLoading(false);
    };
    const handleDrawCreate = (e) => {
        const id = Date.now();
        const color = getRandomColor();
        const newGeofence = {
            id,
            name: `Geofence ${geofences.length + 1}`,
            h3Index: '',
            resolution: 8,
            geoJson: e.features[0],
            color,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setGeofences((prev) => [...prev, newGeofence]);
        setActiveGeofence(id);
        draw.current?.changeMode('simple_select');
    };
    const handleDrawUpdate = (e) => {
        const updatedFeature = e.features[0];
        setGeofences((prev) => prev.map((geofence) => geofence.id === updatedFeature.id ? { ...geofence, geoJson: updatedFeature, updatedAt: new Date() } : geofence));
    };
    const handleDrawDelete = (e) => {
        const deletedIds = e.features.map((f) => f.id);
        setGeofences((prev) => prev.filter((geofence) => !deletedIds.includes(geofence.id)));
        if (deletedIds.includes(activeGeofence))
            setActiveGeofence(null);
    };
    (0, react_1.useEffect)(() => {
        if (isLoading || !mapRef.current)
            return;
        const map = mapRef.current;
        // Remove old geofences
        geofences.forEach((geofence) => {
            const layerId = geofence.id.toString();
            if (map.getLayer(layerId))
                map.removeLayer(layerId);
            if (map.getSource(layerId))
                map.removeSource(layerId);
        });
        // Add updated geofences
        geofences.forEach((geofence) => {
            const layerId = geofence.id.toString();
            map.addSource(layerId, {
                type: 'geojson',
                data: geofence.geoJson,
            });
            map.addLayer({
                id: layerId,
                type: 'fill',
                source: layerId,
                paint: {
                    'fill-color': geofence.color,
                    'fill-opacity': activeGeofence === geofence.id ? 0.5 : 0.3,
                    'fill-outline-color': geofence.color,
                },
            });
            map.on('click', layerId, () => {
                setActiveGeofence(geofence.id);
            });
        });
        return () => {
            geofences.forEach((geofence) => {
                const layerId = geofence.id.toString();
                if (map.getLayer(layerId))
                    map.removeLayer(layerId);
                if (map.getSource(layerId))
                    map.removeSource(layerId);
            });
        };
    }, [geofences, activeGeofence, isLoading]);
    const startDrawing = (mode) => {
        if (draw.current && editMode) {
            draw.current.changeMode(mode);
        }
    };
    const handleNameChange = (id, name) => {
        setGeofences((prev) => prev.map((geofence) => geofence.id === id ? { ...geofence, name, updatedAt: new Date() } : geofence));
    };
    const handleDeleteGeofence = (id) => {
        setGeofences((prev) => prev.filter((geofence) => geofence.id !== id));
        if (activeGeofence === id)
            setActiveGeofence(null);
        const layerId = id.toString();
        if (mapRef.current?.getLayer(layerId))
            mapRef.current.removeLayer(layerId);
        if (mapRef.current?.getSource(layerId))
            mapRef.current.removeSource(layerId);
    };
    const filteredGeofences = geofences.filter((geofence) => geofence.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (isLoading) {
        return (<div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>);
    }
    return (<div className="flex flex-col md:flex-row h-full bg-background">
      <MapComponent_1.MapComponent onMapLoad={handleMapLoad} onDrawCreate={handleDrawCreate} onDrawUpdate={handleDrawUpdate} onDrawDelete={handleDrawDelete} mapRef={mapRef} drawRef={draw}/>
      <GeofenceControls_1.default geofences={filteredGeofences} activeGeofence={activeGeofence} setActiveGeofence={setActiveGeofence} editMode={editMode} setEditMode={setEditMode} onNameChange={handleNameChange} onDelete={handleDeleteGeofence} searchQuery={searchQuery} setSearchQuery={setSearchQuery} startDrawing={startDrawing}/>
    </div>);
};
exports.default = GeofenceMap;
