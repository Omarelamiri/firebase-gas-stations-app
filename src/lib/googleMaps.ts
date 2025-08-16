export async function getNearestGasStation(
  origin: { lat: number; lng: number },
  stations: { id: string; name: string; location: { latitude: number; longitude: number } }[]
) {
  const destinations = stations.map(s => `${s.location.latitude},${s.location.longitude}`).join("|");

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin.lat},${origin.lng}&destinations=${destinations}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  );

  const data = await response.json();

  if (data.status !== "OK") throw new Error(data.error_message || "Google Maps error");

  const distances = data.rows[0].elements.map((el: any, index: number) => ({
    station: stations[index],
    distanceMeters: el.distance.value,
    durationSeconds: el.duration.value
  }));

  distances.sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);

  return distances[0]; // nearest
}
