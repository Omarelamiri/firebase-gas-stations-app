// src/app/gas-stations/[id]/page.tsx
"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/firebase/config";
import { GeoPoint, Timestamp, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";

type Station = {
  id: string;
  name: string;
  brand?: string;
  city?: string;
  address?: string;
  fuelTypes?: string[];
  location?: { latitude: number; longitude: number };
  updatedAt?: Timestamp;
};

export default function GasStationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [station, setStation] = useState<Station | null>(null);
  const [form, setForm] = useState<Station | null>(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      const ref = doc(db, "gasStations", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as any) } as Station;
        setStation(data);
        setForm(data);
      } else {
        setStation(null);
      }
      setLoading(false);
    };
    run();
  }, [id]);

  const set = <K extends keyof Station>(key: K, val: Station[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));

  const handleSave = async () => {
    if (!id || !form) return;
    const ref = doc(db, "gasStations", id);
    // normalize types
    const lat = Number(form.location?.latitude ?? "");
    const lng = Number(form.location?.longitude ?? "");
    const payload: any = {
      name: form.name?.trim() || "",
      brand: form.brand || "",
      city: form.city || "",
      address: form.address || "",
      fuelTypes: (form.fuelTypes || []).map((f) => f.trim()).filter(Boolean),
      // store as GeoPoint; keep a plain copy too if you prefer
      location: new GeoPoint(isFinite(lat) ? lat : 0, isFinite(lng) ? lng : 0),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(ref, payload);
    setEdit(false);
    // refresh view
    const snap = await getDoc(ref);
    setStation({ id, ...(snap.data() as any) });
    setForm({ id, ...(snap.data() as any) });
    alert("Saved");
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteDoc(doc(db, "gasStations", id));
    alert("Deleted");
    router.push("/gas-stations");
  };

  if (loading) return <p>Loading...</p>;
  if (!station) return <p style={{ color: "red" }}>Station not found</p>;

  // derive string values for inputs
  const latVal = String((form?.location as any)?.latitude ?? (form?.location as any)?._latitude ?? "");
  const lngVal = String((form?.location as any)?.longitude ?? (form?.location as any)?._longitude ?? "");

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-xl">
        <h1 className="text-2xl font-bold mb-4">
          {edit ? "Edit Gas Station" : station.name}
        </h1>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col">
            <span className="text-sm mb-1">Name</span>
            <input
              className="border p-2 rounded"
              value={form?.name || ""}
              disabled={!edit}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm mb-1">Brand</span>
            <input
              className="border p-2 rounded"
              value={form?.brand || ""}
              disabled={!edit}
              onChange={(e) => set("brand", e.target.value)}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm mb-1">City</span>
            <input
              className="border p-2 rounded"
              value={form?.city || ""}
              disabled={!edit}
              onChange={(e) => set("city", e.target.value)}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm mb-1">Address</span>
            <input
              className="border p-2 rounded"
              value={form?.address || ""}
              disabled={!edit}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm mb-1">Fuel Types (comma separated)</span>
            <input
              className="border p-2 rounded"
              value={(form?.fuelTypes || []).join(", ")}
              disabled={!edit}
              onChange={(e) =>
                set("fuelTypes", e.target.value.split(",").map((s) => s.trim()))
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm mb-1">Latitude</span>
              <input
                className="border p-2 rounded"
                value={latVal}
                disabled={!edit}
                onChange={(e) =>
                  set("location", {
                    latitude: Number(e.target.value),
                    longitude: Number(lngVal),
                  } as any)
                }
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm mb-1">Longitude</span>
              <input
                className="border p-2 rounded"
                value={lngVal}
                disabled={!edit}
                onChange={(e) =>
                  set("location", {
                    latitude: Number(latVal),
                    longitude: Number(e.target.value),
                  } as any)
                }
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          {edit ? (
            <>
              <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSave}>
                Save
              </button>
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => { setForm(station); setEdit(false); }}>
                Cancel
              </button>
            </>
          ) : (
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setEdit(true)}>
              Edit
            </button>
          )}
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
