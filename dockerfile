# ใช้ Base Image ของ Node.js
FROM node:18-alpine

# ตั้งค่าที่ทำงานใน container
WORKDIR /api

# คัดลอกไฟล์ package ไปยัง container
COPY package.json package-lock.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์ทั้งหมดในโฟลเดอร์ api ไปยัง container
COPY . .

# สร้างโปรเจกต์ TypeScript
RUN npm run test

# เปิดพอร์ตที่แอปพลิเคชันใช้งาน
EXPOSE 3000

# คำสั่งสำหรับเริ่มแอปพลิเคชัน
CMD ["npm", "run", "start"]
