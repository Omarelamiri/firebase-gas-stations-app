"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useGasStations } from "@/hooks/useGasStations";
import GasStationMap from "@/components/GasStationMap";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { stations, loading } = useGasStations();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="flex p-6 gap-6">
        {/* Map Section */}
        <div className="w-1/2 border h-[600px]">
          {!loading && <GasStationMap stations={stations} />}
        </div>

        {/* Table Section */}
        <div className="w-1/2 border p-4 overflow-auto h-[600px]">
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
                {stations.map((station) => (
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
    </ProtectedRoute>
  );
}
