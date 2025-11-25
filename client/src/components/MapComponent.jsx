import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- CUSTOM MARKER ICONS (Visual Credibility) ---
// Using raw.githubusercontent for reliable colored markers
const leafGreen = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const leafRed = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle clicks on map
function LocationSelector({ setLocation, mode, setMode }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setLocation({ lat, lng });
            
            // UX: Auto-switch to next step
            if (mode === 'pickup') {
                setMode('drop'); 
            }
        },
    });
    return null;
}

// Component to fly to user's location
function LocateUser({ trigger }) {
    const map = useMap();
    useEffect(() => {
        if (trigger) {
            map.locate().on("locationfound", function (e) {
                map.flyTo(e.latlng, map.getZoom());
            });
        }
    }, [trigger, map]);
    return null;
}

const MapComponent = ({ pickup, drop, setPickup, setDrop }) => {
    // Default center (Pune, India)
    const [center, setCenter] = useState([18.5204, 73.8567]); 
    const [selectionMode, setSelectionMode] = useState('pickup'); 
    const [locateTrigger, setLocateTrigger] = useState(0);

    // Simple visual line between points
    const routeLine = (pickup && drop) 
        ? [[pickup.lat, pickup.lng], [drop.lat, drop.lng]] 
        : [];

    return (
        <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-gray-100 relative">
            {/* Control Panel Overlay */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="bg-white p-2 rounded-lg shadow-md flex flex-col gap-2">
                    <button 
                        onClick={() => setSelectionMode('pickup')}
                        className={`px-4 py-2 text-sm font-bold rounded transition-colors ${selectionMode === 'pickup' ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        📍 Set Pickup
                    </button>
                    <button 
                        onClick={() => setSelectionMode('drop')}
                        className={`px-4 py-2 text-sm font-bold rounded transition-colors ${selectionMode === 'drop' ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        🏁 Set Drop
                    </button>
                </div>
                
                {/* Locate Me Button */}
                <button 
                    onClick={() => setLocateTrigger(t => t + 1)}
                    className="bg-white p-2 rounded-lg shadow-md text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                    🎯 My Location
                </button>
            </div>

            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                <LocateUser trigger={locateTrigger} />

                {/* Logic to capture clicks */}
                <LocationSelector 
                    mode={selectionMode} 
                    setMode={setSelectionMode}
                    setLocation={selectionMode === 'pickup' ? setPickup : setDrop} 
                />

                {/* Visual Markers with Custom Icons */}
                {pickup && (
                    <Marker position={[pickup.lat, pickup.lng]} icon={leafGreen}>
                        <Popup>Pickup Location</Popup>
                    </Marker>
                )}
                {drop && (
                    <Marker position={[drop.lat, drop.lng]} icon={leafRed}>
                        <Popup>Drop Location</Popup>
                    </Marker>
                )}

                {/* Route Line */}
                {routeLine.length > 0 && <Polyline positions={routeLine} color="#3b82f6" weight={4} opacity={0.7} />}
            </MapContainer>
        </div>
    );
};

export default MapComponent;