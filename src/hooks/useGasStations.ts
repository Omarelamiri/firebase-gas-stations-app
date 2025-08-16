"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface GasStation {
  id: string;
  name: string;
  city: string;
  address: string;
  brand: string;
  fuelTypes: string[];
  prices: Record<string, number>;
  location: { latitude: number; longitude: number };
}

export const useGasStations = () => {
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      const snapshot = await getDocs(collection(db, "gasStations"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        location: {
          latitude: doc.data().location.latitude,
          longitude: doc.data().location.longitude
        }
      })) as GasStation[];
      setStations(data);
      setLoading(false);
    };
    fetchStations();
  }, []);

  return { stations, loading };
};
