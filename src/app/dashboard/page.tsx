'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Adjust path as needed

interface GasStation {
  id: string;
  name: string;
  address: string;
  price: number;
  createdAt: any;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    address: '',
    price: ''
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

    // Cleanup subscription
    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, [router]);

  // Fetch gas stations data
  useEffect(() => {
    if (!user) return;

    console.log('Setting up gas stations listener for user:', user.uid);

    const q = query(
      collection(db, 'gasStations'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const stations: GasStation[] = [];
        querySnapshot.forEach((doc) => {
          stations.push({
            id: doc.id,
            ...doc.data()
          } as GasStation);
        });
        console.log('Gas stations loaded:', stations.length);
        setGasStations(stations);
      },
      (error) => {
        console.error('Error fetching gas stations:', error);
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
    
    if (!newStation.name || !newStation.address || !newStation.price) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await addDoc(collection(db, 'gasStations'), {
        name: newStation.name,
        address: newStation.address,
        price: parseFloat(newStation.price),
        createdAt: new Date(),
        userId: user?.uid
      });

      console.log('Gas station added successfully');
      setNewStation({ name: '', address: '', price: '' });
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
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Add New Gas Station
              </h2>
              <form onSubmit={handleAddStation} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Station Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={newStation.address}
                    onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price per Liter
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    value={newStation.price}
                    onChange={(e) => setNewStation({ ...newStation, price: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-3">
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

          {/* Gas stations list */}
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {gasStations.map((station) => (
                    <div
                      key={station.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {station.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {station.address}
                      </p>
                      <p className="text-lg font-bold text-green-600 mb-3">
                        ${station.price?.toFixed(2)}/L
                      </p>
                      <button
                        onClick={() => handleDeleteStation(station.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}