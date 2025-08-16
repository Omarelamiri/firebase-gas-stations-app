"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function NewGasStationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    city: "",
    address: "",
    fuelTypes: [] as string[],
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "gasStations"), formData);
      alert("Gas station added!");
      router.push("/gas-stations");
    } catch (error) {
      console.error("Failed to add station:", error);
      alert("Failed to add gas station");
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Add New Gas Station</h1>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <label>
            Name:
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="border p-2 rounded w-full"
              required
            />
          </label>
          <label>
            Brand:
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              className="border p-2 rounded w-full"
              required
            />
          </label>
          <label>
            City:
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="border p-2 rounded w-full"
              required
            />
          </label>
          <label>
            Address:
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="border p-2 rounded w-full"
              required
            />
          </label>
          <label>
            Fuel Types (comma separated):
            <input
              type="text"
              value={formData.fuelTypes.join(", ")}
              onChange={(e) =>
                handleChange(
                  "fuelTypes",
                  e.target.value.split(",").map((f) => f.trim())
                )
              }
              className="border p-2 rounded w-full"
            />
          </label>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded mt-4"
          >
            Add Gas Station
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
