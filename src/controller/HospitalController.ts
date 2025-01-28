import { Request, Response } from 'express';
import axios from 'axios';

const GOOGLE_API_KEY = "AIzaSyBqCSDj6uncmfNSNQn2an_10WD2IRTpPZU";

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
}

export const getNearbyHospitals = async (req: Request, res: Response): Promise<void> => {
  const { lat, lng } = req.query;

  // ตรวจสอบว่า lat และ lng มีค่าหรือไม่
  if (!lat || !lng) {
    res.status(400).json({ error: 'Missing required parameters: lat and lng' });
    return;
  }

  try {
    // เรียก Google Places API
    const response = await axios.get<GooglePlacesResponse>(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${lat},${lng}`,
          radius: 10000,
          type: 'hospital',
          key: GOOGLE_API_KEY,
        },
      }
    );

    // ตรวจสอบสถานะผลลัพธ์
    if (response.data.status === 'ZERO_RESULTS') {
      res.status(404).json({ error: 'No nearby hospitals found' });
      return;
    }

    // ดึงข้อมูลเฉพาะโรงพยาบาล 3 แห่งแรก
    const hospitals: Hospital[] = response.data.results.slice(0, 3).map((hospital) => ({
      name: hospital.name,
      address: hospital.vicinity,
      location: hospital.geometry.location,
      rating: hospital.rating || 'N/A',
    }));

    res.status(200).json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch nearby hospitals' });
  }
};


