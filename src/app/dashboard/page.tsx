'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Adjust path as needed
import GasStationMap from '@/components/GasStationMap';


interface GasStation {
  id: string;
  name: string;
  address: string;
  brand: string;
  city: string;
  fuelTypes: string[];
  hasShop: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  openHours: string;
  prices: Record<string, number>; // Changed to match your hook's interface
  services: string[];
  updatedAt: any;
}

export default function Dashboard() { 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'table'>('table');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [newStation, setNewStation] = useState({
    name: '',
    address: '',
    brand: '',
    city: '',
    latitude: '',
    longitude: '',
    openHours: '24/7',
    dieselPrice: '',
    gasoline95Price: '',
    fuelTypes: [] as string[],
    services: [] as string[],
    hasShop: false
  });
  const router = useRouter();

  // Authentication state listener
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
      
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        console.log('User authenticated:', currentUser.email);
      } else {
        console.log('No user found, redirecting to login');
        setLoading(false);
        router.push('/login');
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, [router]);

  // Fetch gas stations data
  useEffect(() => {
    if (!user) return;

    console.log('Setting up gas stations listener...');

    const q = query(
      collection(db, 'gasStations'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const stations: GasStation[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter out undefined values from prices
          const cleanPrices: Record<string, number> = {};
          if (data.prices && typeof data.prices === 'object') {
            Object.entries(data.prices).forEach(([key, value]) => {
              if (typeof value === 'number') {
                cleanPrices[key] = value;
              }
            });
          }

          stations.push({
            id: doc.id,
            name: data.name || 'Unknown Station',
            address: data.address || 'No address',
            brand: data.brand || 'Unknown Brand',
            city: data.city || 'Unknown City',
            fuelTypes: data.fuelTypes || [],
            hasShop: data.hasShop || false,
            location: data.location || { latitude: 0, longitude: 0 },
            openHours: data.openHours || '24/7',
            prices: cleanPrices, // Use cleaned prices without undefined values
            services: data.services || [],
            updatedAt: data.updatedAt
          });
        });
        console.log('Gas stations loaded:', stations.length);
        setGasStations(stations);
      },
      (error) => {
        console.error('Error fetching gas stations:', error);
        alert('Error loading gas stations. Check console for details.');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('User logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Add new gas station
  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStation.name || !newStation.address || !newStation.city) {
      alert('Please fill in required fields (name, address, city)');
      return;
    }

    try {
      const stationData = {
        name: newStation.name,
        address: newStation.address,
        brand: newStation.brand,
        city: newStation.city,
        fuelTypes: newStation.fuelTypes,
        hasShop: newStation.hasShop,
        location: {
          latitude: parseFloat(newStation.latitude) || 0,
          longitude: parseFloat(newStation.longitude) || 0
        },
        openHours: newStation.openHours,
        prices: {
          ...(parseFloat(newStation.dieselPrice) > 0 && { diesel: parseFloat(newStation.dieselPrice) }),
          ...(parseFloat(newStation.gasoline95Price) > 0 && { gasoline95: parseFloat(newStation.gasoline95Price) })
        },
        services: newStation.services,
        updatedAt: new Date(),
        userId: user?.uid
      };

      await addDoc(collection(db, 'gasStations'), stationData);

      console.log('Gas station added successfully');
      setNewStation({
        name: '', address: '', brand: '', city: '', latitude: '', longitude: '',
        openHours: '24/7', dieselPrice: '', gasoline95Price: '', fuelTypes: [], services: [], hasShop: false
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding gas station:', error);
      alert('Error adding gas station. Please try again.');
    }
  };

  // Delete gas station
  const handleDeleteStation = async (id: string) => {
    if (confirm('Are you sure you want to delete this gas station?')) {
      try {
        await deleteDoc(doc(db, 'gasStations', id));
        console.log('Gas station deleted successfully');
      } catch (error) {
        console.error('Error deleting gas station:', error);
        alert('Error deleting gas station. Please try again.');
      }
    }
  };

  // Navigate to station details
  const handleStationClick = (station: GasStation) => {
    setSelectedStation(station);
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login redirect if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Gas Stations Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('table')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'map'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Map View
              </button>
            </nav>
          </div>

          {/* Add station button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add New Gas Station'}
            </button>
          </div>

          {/* Add station form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Gas Station</h2>
              <form onSubmit={handleAddStation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Station Name *</label>
                  <input
                    type="text"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <input
                    type="text"
                    value={newStation.brand}
                    onChange={(e) => setNewStation({ ...newStation, brand: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address *</label>
                  <input
                    type="text"
                    value={newStation.address}
                    onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    value={newStation.city}
                    onChange={(e) => setNewStation({ ...newStation, city: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newStation.latitude}
                    onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newStation.longitude}
                    onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diesel Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStation.dieselPrice}
                    onChange={(e) => setNewStation({ ...newStation, dieselPrice: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gasoline 95 Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStation.gasoline95Price}
                    onChange={(e) => setNewStation({ ...newStation, gasoline95Price: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="hasShop"
                      type="checkbox"
                      checked={newStation.hasShop}
                      onChange={(e) => setNewStation({ ...newStation, hasShop: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasShop" className="ml-2 block text-sm text-gray-900">
                      Has Shop
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 flex space-x-3">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Add Station
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'table' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Gas Stations ({gasStations.length})
                </h2>
                
                {gasStations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No gas stations found. Add your first gas station above.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diesel</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gasoline 95</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {gasStations.map((station) => (
                          <tr
                            key={station.id}
                            onClick={() => {
                              console.log("Clicked station:", station.id);
                              router.push(`/gas-stations/${station.id}`);
                            }}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {station.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {station.brand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {station.city}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {station.prices.diesel ? `${station.prices.diesel} MAD` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {station.prices.gasoline95 ? `${station.prices.gasoline95} MAD` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStation(station.id);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="flex gap-6 h-[600px]">
              {/* Map Section */}
              <div className="w-1/2 border">
                {!loading && gasStations.length > 0 ? (
                  <GasStationMap stations={gasStations} />
                ) : loading ? (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">Loading map...</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">No stations to display on map</p>
                  </div>
                )}
              </div>
              
              {/* Table Section */}
              <div className="w-1/2 border p-4 overflow-auto">
                <h2 className="text-xl font-bold mb-4">Gas Stations</h2>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">City</th>
                        <th className="border p-2">Brand</th>
                        <th className="border p-2">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gasStations.map((station) => (
                        <tr
                          key={station.id}
                          className="hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            console.log("Clicked station:", station.id);
                            router.push(`/gas-stations/${station.id}`);
                          }}
                        >
                          <td className="border p-2">{station.name}</td>
                          <td className="border p-2">{station.city}</td>
                          <td className="border p-2">{station.brand}</td>
                          <td className="border p-2">{station.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Station Details Modal */}
          {selectedStation && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{selectedStation.name}</h3>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <p><strong>Brand:</strong> {selectedStation.brand}</p>
                  <p><strong>Address:</strong> {selectedStation.address}</p>
                  <p><strong>City:</strong> {selectedStation.city}</p>
                  <p><strong>Open Hours:</strong> {selectedStation.openHours}</p>
                  <p><strong>Has Shop:</strong> {selectedStation.hasShop ? 'Yes' : 'No'}</p>
                  <p><strong>Location:</strong> {selectedStation.location.latitude}, {selectedStation.location.longitude}</p>
                  
                  <div>
                    <strong>Fuel Types:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {selectedStation.fuelTypes.map((fuel, index) => (
                        <li key={index}>{fuel}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <strong>Services:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {selectedStation.services.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <strong>Prices:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {Object.entries(selectedStation.prices).map(([fuel, price]) => (
                        <li key={fuel}>{fuel}: {price} MAD</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}