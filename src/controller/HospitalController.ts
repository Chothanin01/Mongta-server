import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY: string | undefined = process.env.GOOGLE_API_KEY;

  // Set Point
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

  // Check Lat Lng
  if (!lat || !lng) {
    res.status(400).send({ 
      success: false,
      message: 'Missing required parameters: lat and lng' 
    });
    return;
  }

  try {
    // Google Place Api
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

    // Check status
    if (response.data.status === 'ZERO_RESULTS') {
      res.status(404).send({
        success: false,
        message: "No Nearest Hospitals Found."
      });
      return;
    }

    // Select data Hospital
    const hospitals: Hospital[] = response.data.results.slice(0, 3).map((hospital) => ({
      name: hospital.name,
      address: hospital.vicinity,
      location: hospital.geometry.location,
      rating: hospital.rating || 'N/A',
    }));

    res.status(200).json(hospitals);
  } catch (error) {
    console.log(error);
      res.status(500).json({ 
        error,
        success: false,
        message: "Eror finding Nearest Hospitals."
    })
  }
};


