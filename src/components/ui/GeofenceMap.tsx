'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  ZoomControl,
} from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import { GeoJSON } from 'react-leaflet'
import GeofenceControls from './GeofenceControls'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
const MAPBOX_ACCESS_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN'
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon
interface Geofence {
  id: string
  name: string
  description?: string
  geoJson: any
  color: string
  createdAt: Date
}
const GeofenceMap = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [activeGeofence, setActiveGeofence] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [mapCenter] = useState<[number, number]>([51.505, -0.09])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const featureGroupRef = useRef<any>(null)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])
  const colorPalette = [
    '#FF5F6D',
    '#47B881',
    '#4299E1',
    '#FFC107',
    '#9F7AEA',
    '#ED64A6',
  ]
  const getRandomColor = () => {
    return colorPalette[Math.floor(Math.random() * colorPalette.length)]
  }
  const filteredGeofences = geofences.filter((geofence) =>
    geofence.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const handleCreated = (e: any) => {
    const { layerType, layer } = e
    if (layerType === 'polygon' || layerType === 'rectangle') {
      const id = `geofence-${Date.now()}`
      const color = getRandomColor()
      layer.options.color = color
      layer.options.fillColor = color
      const newGeofence: Geofence = {
        id,
        name: `Geofence ${geofences.length + 1}`,
        geoJson: layer.toGeoJSON(),
        color,
        createdAt: new Date(),
      }
      setGeofences((prev) => [...prev, newGeofence])
      setActiveGeofence(id)
    }
  }
  const handleEdited = (e: any) => {
    const layers = e.layers.getLayers()
    setGeofences((prev) => {
      const updated = [...prev]
      layers.forEach((layer: any) => {
        const id = layer.options.id
        if (id) {
          const index = updated.findIndex((g) => g.id === id)
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              geoJson: layer.toGeoJSON(),
            }
          }
        }
      })
      return updated
    })
  }
  const handleDeleted = (e: any) => {
    const layers = e.layers.getLayers()
    setGeofences((prev) => {
      const remaining = prev.filter(
        (geofence) =>
          !layers.some((layer: any) => layer.options.id === geofence.id),
      )
      return remaining
    })
    if (activeGeofence) {
      const deletedLayer = layers.find(
        (layer: any) => layer.options.id === activeGeofence,
      )
      if (deletedLayer) {
        setActiveGeofence(null)
      }
    }
  }
  const handleNameChange = (id: string, name: string) => {
    setGeofences((prev) =>
      prev.map((geofence) =>
        geofence.id === id
          ? {
              ...geofence,
              name,
            }
          : geofence,
      ),
    )
  }
  const handleDeleteGeofence = (id: string) => {
    setGeofences((prev) => prev.filter((g) => g.id !== id))
    if (activeGeofence === id) {
      setActiveGeofence(null)
    }
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col md:flex-row h-full bg-background">
      <div className="w-full md:w-3/4 h-3/4 md:h-full relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          zoomControl={false}
          className="h-full w-full"
          style={{
            background: '#242424',
          }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
            maxZoom={18}
          />
          {filteredGeofences.map((geofence) => (
            <GeoJSON
              key={geofence.id}
              data={geofence.geoJson}
              pathOptions={{
                color: geofence.color,
                fillColor: geofence.color,
                fillOpacity: 0.3,
                weight: activeGeofence === geofence.id ? 3 : 2,
                opacity: activeGeofence === geofence.id ? 1 : 0.8,
              }}
              eventHandlers={{
                click: () => setActiveGeofence(geofence.id),
              }}
            />
          ))}
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                rectangle: {
                  shapeOptions: {
                    color: getRandomColor(),
                    fillOpacity: 0.3,
                  },
                },
                polygon: {
                  shapeOptions: {
                    color: getRandomColor(),
                    fillOpacity: 0.3,
                  },
                  allowIntersection: false,
                  drawError: {
                    color: '#e1e4e8',
                    message:
                      '<strong>Error:</strong> Shape edges cannot cross!',
                  },
                  showArea: true,
                },
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
              }}
              edit={{
                featureGroup: featureGroupRef.current,
                remove: true,
                edit: true,
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>
      <GeofenceControls
        geofences={filteredGeofences}
        activeGeofence={activeGeofence}
        setActiveGeofence={setActiveGeofence}
        editMode={editMode}
        setEditMode={setEditMode}
        onNameChange={handleNameChange}
        onDelete={handleDeleteGeofence}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  )
}
export default GeofenceMap

