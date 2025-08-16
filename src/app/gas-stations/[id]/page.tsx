"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function StationDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchStation = async () => {
      try {
        const docRef = doc(db, "gasStations", String(id));
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setStation(data);
          setName(data.name || "");
          setLatitude(data.location?.lat || "");
          setLongitude(data.location?.lng || "");
          setFuelType(data.fuelType || "");
          setPrice(data.price || "");
        } else {
          console.error("Station not found");
        }
      } catch (error) {
        console.error("Error fetching station:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      const stationRef = doc(db, "gasStations", String(id));
      await updateDoc(stationRef, {
        name,
        location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        fuelType,
        price: parseFloat(price),
      });
      alert("Station updated successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating station:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      const stationRef = doc(db, "gasStations", String(id));
      await deleteDoc(stationRef);
      alert("Station deleted successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting station:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!station) return <p>Station not found.</p>;

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Edit Gas Station</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="border p-2 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <input
              className="border p-2 w-full"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <input
              className="border p-2 w-full"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Fuel Type</label>
            <input
              className="border p-2 w-full"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Price</label>
            <input
              type="number"
              className="border p-2 w-full"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <button
            onClick={handleUpdate}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Update Station
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded ml-2"
          >
            Delete Station
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
