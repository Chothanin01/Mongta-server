import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY: string | undefined = process.env.GOOGLE_API_KEY;
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

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

interface GeocodingResponse {
  results: {
    formatted_address: string;
  }[];
}

interface Hospital {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number | string;
}

// Search Hospital
export const searchHospitals = async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;

  if (!query) {
    res.status(400).send({
      success: false,
      message: 'Missing query parameter for search.',
    });
    return;
  }

  try {
    // Search Google Places API
    const response = await axios.get<GooglePlacesResponse>(
      `https://maps.googleapis.com/maps/api/place/textsearch/json`,
      {
        params: {
          query: `hospital ${query}`,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status === 'ZERO_RESULTS') {
      res.status(404).send({
        success: false,
        message: "No hospitals found matching your search.",
      });
      return;
    }

    // Data Map for Google API
    const hospitals: Hospital[] = await Promise.all(
      response.data.results.map(async (hospital) => {
        let address = hospital.vicinity || 'Address not available';

        if (!hospital.vicinity) {
          try {
            const geocodingResponse = await axios.get<GeocodingResponse>(
              GOOGLE_GEOCODING_API_URL,
              {
                params: {
                  latlng: `${hospital.geometry.location.lat},${hospital.geometry.location.lng}`,
                  key: GOOGLE_API_KEY,
                },
              }
            );
            address = geocodingResponse.data.results[0]?.formatted_address || 'Address not found';
          } catch (error) {
            console.log('Error reverse geocoding:', error);
            address = 'Address not found';
          }
        }

        return {
          name: hospital.name,
          address,
          location: hospital.geometry.location,
          rating: hospital.rating ?? 'N/A',
        };
      })
    );

    //Respone to Front-end
    res.status(200).json(hospitals);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error searching for hospitals.',
    });
  }
};
