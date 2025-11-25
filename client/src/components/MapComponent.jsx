import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons not showing in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle clicks on map
function LocationSelector({ setLocation, mode }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            console.log(`Selected ${mode}:`, lat, lng);
            setLocation({ lat, lng });
        },
    });
    return null;
}

const MapComponent = ({ pickup, drop, setPickup, setDrop }) => {
    // Default center (Pune, India) - Change to your city
    const [center, setCenter] = useState([18.5204, 73.8567]); 
    const [selectionMode, setSelectionMode] = useState('pickup'); // 'pickup' or 'drop'

    // Simple visual line between points
    const routeLine = (pickup && drop) 
        ? [[pickup.lat, pickup.lng], [drop.lat, drop.lng]] 
        : [];

    return (
        <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-gray-100 relative">
            {/* Control Panel Overlay */}
            <div className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-md flex flex-col gap-2">
                <button 
                    onClick={() => setSelectionMode('pickup')}
                    className={`px-4 py-2 text-sm font-bold rounded ${selectionMode === 'pickup' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                >
                    📍 Set Pickup
                </button>
                <button 
                    onClick={() => setSelectionMode('drop')}
                    className={`px-4 py-2 text-sm font-bold rounded ${selectionMode === 'drop' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                >
                    🏁 Set Drop
                </button>
            </div>

            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* Logic to capture clicks */}
                <LocationSelector 
                    mode={selectionMode} 
                    setLocation={selectionMode === 'pickup' ? setPickup : setDrop} 
                />

                {/* Visual Markers */}
                {pickup && (
                    <Marker position={[pickup.lat, pickup.lng]}>
                        <Popup>Pickup Location</Popup>
                    </Marker>
                )}
                {drop && (
                    <Marker position={[drop.lat, drop.lng]}>
                        <Popup>Drop Location</Popup>
                    </Marker>
                )}

                {/* Route Line (Visual Only for MVP) */}
                {routeLine.length > 0 && <Polyline positions={routeLine} color="blue" />}
            </MapContainer>
        </div>
    );
};

export default MapComponent;