'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Adjust path as needed

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
  prices: Record<string, number>;
  services: string[];
  updatedAt: any;
}

export default function GasStationDetailPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [station, setStation] = useState<GasStation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const stationId = params?.id as string;

  // Authentication state listener
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
      
      if (currentUser) {
        setUser(currentUser);
      } else {
        console.log('No user found, redirecting to login');
        router.push('/login');
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, [router]);

  // Fetch station data
  useEffect(() => {
    if (!user || !stationId) return;

    console.log('Fetching station data for ID:', stationId);

    const fetchStation = async () => {
      try {
        const docRef = doc(db, 'gasStations', stationId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Filter out undefined values from prices
          const cleanPrices: Record<string, number> = {};
          if (data.prices && typeof data.prices === 'object') {
            Object.entries(data.prices).forEach(([key, value]) => {
              if (typeof value === 'number') {
                cleanPrices[key] = value;
              }
            });
          }

          const stationData: GasStation = {
            id: docSnap.id,
            name: data.name || 'Unknown Station',
            address: data.address || 'No address',
            brand: data.brand || 'Unknown Brand',
            city: data.city || 'Unknown City',
            fuelTypes: data.fuelTypes || [],
            hasShop: data.hasShop || false,
            location: data.location || { latitude: 0, longitude: 0 },
            openHours: data.openHours || '24/7',
            prices: cleanPrices,
            services: data.services || [],
            updatedAt: data.updatedAt
          };

          setStation(stationData);
          console.log('Station data loaded:', stationData);
        } else {
          setError('Gas station not found');
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching station:', error);
        setError('Error loading gas station data');
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [user, stationId]);

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gas station details...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
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

  // Show station details
  if (!station) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Station not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
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
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {station.name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Station Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {station.name}
                </h2>
                <p className="text-lg text-gray-600">{station.brand}</p>
              </div>

              {/* Station Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="text-sm text-gray-900">{station.address}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">City</dt>
                      <dd className="text-sm text-gray-900">{station.city}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Open Hours</dt>
                      <dd className="text-sm text-gray-900">{station.openHours}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Has Shop</dt>
                      <dd className="text-sm text-gray-900">
                        {station.hasShop ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="text-sm text-gray-900">
                        {station.location.latitude.toFixed(6)}, {station.location.longitude.toFixed(6)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Prices */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Fuel Prices
                  </h3>
                  {Object.keys(station.prices).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(station.prices).map(([fuel, price]) => (
                        <div key={fuel} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {fuel.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {price} MAD
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No prices available</p>
                  )}
                </div>
              </div>

              {/* Fuel Types */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Fuel Types
                </h3>
                {station.fuelTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {station.fuelTypes.map((fuel, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {fuel}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No fuel types specified</p>
                )}
              </div>

              {/* Services */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Services
                </h3>
                {station.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {station.services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No services specified</p>
                )}
              </div>

              {/* Map Section */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Location
                </h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Map View</p>
                    <p className="text-sm text-gray-500">
                      Lat: {station.location.latitude}, Lng: {station.location.longitude}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Map integration can be added here
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex space-x-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${station.location.latitude},${station.location.longitude}`, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}