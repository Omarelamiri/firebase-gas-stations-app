"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGasStations } from "@/hooks/useGasStations";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function GasStationsPage() {
  const { stations, loading } = useGasStations();
  const router = useRouter();

  const [brandFilter, setBrandFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");

  // Filtered stations
  const filteredStations = useMemo(() => {
    return stations.filter((s) => 
      (!brandFilter || s.brand.toLowerCase().includes(brandFilter.toLowerCase())) &&
      (!cityFilter || s.city.toLowerCase().includes(cityFilter.toLowerCase())) &&
      (!fuelFilter || s.fuelTypes.some(f => f.toLowerCase().includes(fuelFilter.toLowerCase())))
    );
  }, [stations, brandFilter, cityFilter, fuelFilter]);

  if (loading) return <p>Loading...</p>;

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Gas Stations</h1>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Filter by brand"
            className="border p-2 rounded"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by city"
            className="border p-2 rounded"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by fuel type"
            className="border p-2 rounded"
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
          />
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">City</th>
              <th className="border p-2">Brand</th>
              <th className="border p-2">Fuel Types</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.map((station) => (
              <tr
                key={station.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push(`/gas-stations/${station.id}`)}
              >
                <td className="border p-2">{station.name}</td>
                <td className="border p-2">{station.city}</td>
                <td className="border p-2">{station.brand}</td>
                <td className="border p-2">{station.fuelTypes.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}
