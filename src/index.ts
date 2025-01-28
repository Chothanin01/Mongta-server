import express from 'express';
import cors from 'cors';
import { getNearbyHospitals } from './controller/HospitalController';


const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// ใช้ Controller ตรงในเส้นทาง
app.get('/nearby-hospitals', getNearbyHospitals);

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
