import express from 'express';
import cors from 'cors';
import { getNearbyHospitals } from './controller/HospitalController';


const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Use Controller
app.get('/nearby-hospitals', getNearbyHospitals);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
