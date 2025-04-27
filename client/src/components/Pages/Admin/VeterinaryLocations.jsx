import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Plus, Search, Edit, Trash2, Check, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

const VeterinaryLocations = () => {
  console.log('VeterinaryLocations component loaded');
  
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to center of India
  const [selectedVet, setSelectedVet] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    specialization: '',
    workingHours: '',
    services: '',
    latitude: '',
    longitude: '',
    rating: 0
  });

  // Fetch veterinarians
  useEffect(() => {
    fetchVeterinarians();
  }, []);

  const fetchVeterinarians = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/veterinarians`);
      setVeterinarians(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching veterinarians:', error);
      setError('Failed to load veterinarians.');
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'services' ? value : name === 'rating' ? parseFloat(value) : value
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      specialization: '',
      workingHours: '',
      services: '',
      latitude: '',
      longitude: '',
      rating: 0
    });
    setIsAdding(false);
    setIsEditing(false);
    setSelectedVet(null);
  };

  // Create new veterinarian
  const handleCreateVet = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const vetData = {
        ...formData,
        services: formData.services.split(',').map(s => s.trim()).filter(s => s),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };
      
      const response = await axios.post(`${API_URL}/veterinarians`, vetData);
      setVeterinarians([...veterinarians, response.data]);
      resetForm();
      setLoading(false);
    } catch (error) {
      console.error('Error creating veterinarian:', error);
      setError('Failed to create veterinarian.');
      setLoading(false);
    }
  };

  // Update veterinarian
  const handleUpdateVet = async (e) => {
    e.preventDefault();
    if (!selectedVet) return;
    
    try {
      setLoading(true);
      const vetData = {
        ...formData,
        services: formData.services.split(',').map(s => s.trim()).filter(s => s),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };
      
      const response = await axios.put(`${API_URL}/veterinarians/${selectedVet._id}`, vetData);
      
      setVeterinarians(veterinarians.map(vet => 
        vet._id === selectedVet._id ? response.data : vet
      ));
      
      resetForm();
      setLoading(false);
    } catch (error) {
      console.error('Error updating veterinarian:', error);
      setError('Failed to update veterinarian.');
      setLoading(false);
    }
  };

  // Delete veterinarian
  const handleDeleteVet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this veterinarian?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/veterinarians/${id}`);
      setVeterinarians(veterinarians.filter(vet => vet._id !== id));
      setLoading(false);
    } catch (error) {
      console.error('Error deleting veterinarian:', error);
      setError('Failed to delete veterinarian.');
      setLoading(false);
    }
  };

  // Edit veterinarian
  const handleEditVet = (vet) => {
    setSelectedVet(vet);
    setFormData({
      name: vet.name,
      address: vet.address,
      phone: vet.phone,
      specialization: vet.specialization,
      workingHours: vet.workingHours,
      services: Array.isArray(vet.services) ? vet.services.join(', ') : '',
      latitude: vet.latitude.toString(),
      longitude: vet.longitude.toString(),
      rating: vet.rating || 0
    });
    setIsEditing(true);
    setIsAdding(false);
  };

  // Add new veterinarian
  const handleAddNew = () => {
    resetForm();
    setIsAdding(true);
    setIsEditing(false);
  };

  // Filter veterinarians by search term
  const filteredVeterinarians = veterinarians.filter(vet =>
    vet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Veterinary Locations</h1>
        
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search veterinarians..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New
          </button>
        </div>
      </div>
      
      {/* Map view */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="h-[400px]">
          <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
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
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      
      {/* Form for adding or editing */}
      {(isAdding || isEditing) && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isAdding ? 'Add New Veterinarian' : 'Edit Veterinarian'}
          </h2>
          
          <form onSubmit={isAdding ? handleCreateVet : handleUpdateVet}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.specialization}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="workingHours" className="block text-sm font-medium text-gray-700 mb-1">
                  Working Hours
                </label>
                <input
                  type="text"
                  id="workingHours"
                  name="workingHours"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.workingHours}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  id="latitude"
                  name="latitude"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.latitude}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.longitude}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-1">
                  Services (comma separated)
                </label>
                <input
                  type="text"
                  id="services"
                  name="services"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.services}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.rating}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {isAdding ? 'Create' : 'Update'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      {/* Veterinarians table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && !veterinarians.length ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading veterinarians...
                  </td>
                </tr>
              ) : filteredVeterinarians.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No veterinarians found.
                  </td>
                </tr>
              ) : (
                filteredVeterinarians.map((vet) => (
                  <tr key={vet._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-green-600 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{vet.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vet.specialization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vet.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vet.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vet.rating ? `${vet.rating}/5` : 'No rating'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditVet(vet)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVet(vet._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VeterinaryLocations; 