import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY: string | undefined = process.env.GOOGLE_API_KEY;

interface GooglePlacesResponse {
  status: string;
  results: {
    name: string;
    vicinity: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
  }[];
}

interface Hospital {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number | string;
  distance?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const getNearbyHospitals = async (req: Request, res: Response): Promise<void> => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).send({ 
      success: false,
      message: 'Missing required parameters: lat and lng' 
    });
    return;
  }

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);

  try {
    const response = await axios.get<GooglePlacesResponse>(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${userLat},${userLng}`,
          type: 'hospital',
          rankby: 'distance',
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status === 'ZERO_RESULTS') {
      res.status(404).send({
        success: false,
        message: "No Nearest Hospitals Found."
      });
      return;
    }

    const hospitals: Hospital[] = response.data.results.map((hospital) => ({
      name: hospital.name,
      address: hospital.vicinity,
      location: hospital.geometry.location,
      rating: hospital.rating || 'N/A',
      distance: calculateDistance(
        userLat,
        userLng,
        hospital.geometry.location.lat,
        hospital.geometry.location.lng
      ),
    }));

    const nearestHospitals = hospitals
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 3);

    res.status(200).json(nearestHospitals);
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      error,
      success: false,
      message: "Error finding Nearest Hospitals."
    });
  }
};