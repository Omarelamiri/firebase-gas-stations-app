import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, GeoPoint, serverTimestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
// Load environment variables from .env.local file
dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  const stations = [
    {
      name: "Station Alpha",
      location: new GeoPoint(34.020882, -6.841650),
      address: "123 Main St",
      city: "Rabat",
      brand: "Shell",
      fuelTypes: ["Gasoline 95", "Diesel"],
      prices: { gasoline95: 1.23, diesel: 1.10 },
      openHours: "24/7",
      hasShop: true,
      services: ["Car Wash", "ATM"]
    },
    {
      name: "Station Beta",
      location: new GeoPoint(33.573110, -7.589843),
      address: "456 Elm St",
      city: "Casablanca",
      brand: "Total",
      fuelTypes: ["Gasoline 95", "Gasoline 98", "Diesel"],
      prices: { gasoline95: 1.20, gasoline98: 1.40, diesel: 1.12 },
      openHours: "06:00-23:00",
      hasShop: false,
      services: ["ATM"]
    }
  ];

  for (const station of stations) {
    await addDoc(collection(db, "gasStations"), {
      ...station,
      updatedAt: serverTimestamp()
    });
    console.log(`Added: ${station.name}`);
  }

  console.log("Seeding complete!");
}

seedData().catch(console.error);
