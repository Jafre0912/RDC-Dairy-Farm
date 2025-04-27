import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Award, Search } from 'lucide-react';
import axios from 'axios';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Fix for default marker icons in react-leaflet
let DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Fallback responses when API is not available
const fallbackResponses = {
  "symptom": "For livestock showing symptoms like lethargy, reduced appetite, or abnormal behavior, monitor them closely and consult a veterinarian if symptoms persist for more than 24 hours. Keep the animal comfortable, ensure it has access to clean water, and consider isolating it from the herd if an infectious disease is suspected.",
  "disease": "Common livestock diseases include mastitis, foot rot, respiratory infections, and parasitic diseases. Early detection is key to treatment. Look for changes in behavior, appetite, milk production, and physical symptoms. Maintain good hygiene, proper nutrition, and regular vaccinations to prevent disease spread.",
  "treatment": "While waiting for veterinary assistance, ensure the animal is comfortable, has access to clean water and appropriate food. For minor injuries, cleaning with diluted antiseptic solution may help. However, avoid administering medications without professional guidance as improper treatment can worsen the condition.",
  "prevention": "Disease prevention in livestock includes regular vaccinations, proper nutrition, clean housing conditions, biosecurity measures, parasite control, and stress management. Regular health checks and maintaining quarantine protocols for new animals are also essential practices.",
  "nutrition": "Livestock nutrition requirements vary by species, age, and production stage. A balanced diet should include appropriate amounts of protein, energy, minerals, vitamins, and clean water. Consult a nutritionist to develop a feeding program tailored to your animals' specific needs.",
  "emergency": "In veterinary emergencies, contact your veterinarian immediately. While waiting, keep the animal calm and comfortable, stop any bleeding with pressure, and don't give food or water if the animal appears to have digestive issues or is struggling to breathe."
};

const VeterinaryServices = () => {
  const [veterinarians, setVeterinarians] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to center of India
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch veterinarians from the server
    fetchVeterinarians();
    // Get user's location
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.log("Geolocation is not available in this browser.");
    }
  };

  const fetchVeterinarians = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/veterinarians`);
      // Ensure we're setting an array
      const vetsData = Array.isArray(response.data) ? response.data : [];
      setVeterinarians(vetsData);
      console.log('Fetched veterinarians:', vetsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching veterinarians:', error);
      setError('Failed to load veterinarians. Using sample data instead.');
      // Use sample data as fallback
      setVeterinarians(sampleVets);
      setLoading(false);
    }
  };

  // Sample data for testing
  const sampleVets = [
    {
      _id: '1',
      name: 'Dr. Smith',
      address: '123 Main St, City',
      phone: '+1234567890',
      specialization: 'Large Animals',
      workingHours: '9 AM - 6 PM',
      rating: 4.5,
      services: ['General Checkup', 'Vaccination', 'Surgery'],
      latitude: 20.5937,
      longitude: 78.9629
    },
    {
      _id: '2',
      name: 'Dr. Johnson',
      address: '456 Park Ave, Town',
      phone: '+0987654321',
      specialization: 'Dairy Cattle',
      workingHours: '8 AM - 5 PM',
      rating: 4.8,
      services: ['Mastitis Treatment', 'Reproductive Health', 'Nutrition Consulting'],
      latitude: 19.0760,
      longitude: 72.8777
    },
    {
      _id: '3',
      name: 'Dr. Patel',
      address: '789 Rural Road, Village',
      phone: '+1122334455',
      specialization: 'General Livestock',
      workingHours: '10 AM - 7 PM',
      rating: 4.2,
      services: ['Hoof Care', 'Dental Care', 'Emergency Services'],
      latitude: 28.7041,
      longitude: 77.1025
    }
  ];

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "Unknown";
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Get all unique services
  const getAllServices = () => {
    const servicesSet = new Set(['All']);
    veterinarians.forEach(vet => {
      if (vet.services && Array.isArray(vet.services)) {
        vet.services.forEach(service => servicesSet.add(service));
      }
    });
    return Array.from(servicesSet);
  };

  // Filter veterinarians by search term and selected service
  const filteredVeterinarians = veterinarians.filter(vet => {
    const matchesSearch = 
      vet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = selectedService === 'All' || 
      (vet.services && vet.services.includes(selectedService));
    
    return matchesSearch && matchesService;
  });

  // Sort veterinarians by distance if user location is available
  const sortedVeterinarians = userLocation 
    ? [...filteredVeterinarians].sort((a, b) => {
        const distA = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          a.latitude, 
          a.longitude
        );
        const distB = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          b.latitude, 
          b.longitude
        );
        return parseFloat(distA) - parseFloat(distB);
      })
    : filteredVeterinarians;

  const services = getAllServices();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Veterinary Services</h1>
        <p className="text-gray-600 mb-4">Find trusted veterinarians specialized in livestock and dairy cattle care near you.</p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search veterinarians by name, location or specialization..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            {services.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="h-[400px]">
          <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User's location */}
            {userLocation && (
              <Marker 
                position={[userLocation.latitude, userLocation.longitude]}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: iconShadow,
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Veterinarians */}
            {veterinarians.map((vet) => (
              <Marker 
                key={vet._id} 
                position={[vet.latitude, vet.longitude]}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: iconShadow,
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-green-700">{vet.name}</h3>
                    <p className="text-sm text-gray-600">{vet.specialization}</p>
                    <p className="text-sm">📍 {vet.address}</p>
                    <p className="text-sm">📱 {vet.phone}</p>
                    <p className="text-sm">⏰ {vet.workingHours}</p>
                    {vet.rating && <p className="text-sm">⭐ {vet.rating}/5</p>}
                    {userLocation && (
                      <p className="text-sm mt-1 font-semibold">
                        📏 {calculateDistance(
                          userLocation.latitude, 
                          userLocation.longitude, 
                          vet.latitude, 
                          vet.longitude
                        )} km away
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Veterinarians section */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">⚠️</span>
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {userLocation ? 'Veterinarians Near You' : 'All Veterinarians'}
          </h2>

          {sortedVeterinarians.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600">No veterinarians found matching your criteria.</p>
              <button
                onClick={() => {setSearchTerm(''); setSelectedService('All');}}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {sortedVeterinarians.map((vet) => (
                <motion.div
                  key={vet._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-green-700">{vet.name}</h3>
                        <p className="text-gray-600">{vet.specialization}</p>
                      </div>
                      {vet.rating && (
                        <div className="flex items-center bg-green-50 px-2 py-1 rounded-lg">
                          <Award className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-semibold">{vet.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-2 text-gray-500 mt-0.5" />
                        <span className="text-gray-700">{vet.address}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 mr-2 text-gray-500" />
                        <a href={`tel:${vet.phone}`} className="text-blue-600 hover:underline">
                          {vet.phone}
                        </a>
            </div>

                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-gray-500" />
                        <span className="text-gray-700">{vet.workingHours}</span>
                      </div>
                      
                      {userLocation && (
                        <div className="flex items-center font-medium text-green-700">
                          <span>
                            {calculateDistance(
                              userLocation.latitude, 
                              userLocation.longitude, 
                              vet.latitude, 
                              vet.longitude
                            )} km away
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {vet.services && vet.services.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {vet.services.map((service, index) => (
                            <span 
                              key={index} 
                              className="inline-block px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                            >
                              {service}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                    
                  <button
                      className="mt-6 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      onClick={() => window.open(`tel:${vet.phone}`)}
                  >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                  </button>
                  </div>
                </motion.div>
              ))}
                  </div>
                )}
              </>
            )}
    </div>
  );
};

export default VeterinaryServices; 