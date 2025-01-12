// src/features/common/Modal/utils/faceApi.js

import * as faceapi from 'face-api.js';

/**
 * โหลดโมเดลที่จำเป็นสำหรับ face-api.js
 */
export async function loadModels() {
    const MODEL_URL = process.env.PUBLIC_URL + '/models'; // ตรวจสอบให้แน่ใจว่าเส้นทางถูกต้อง
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("face-api.js models loaded successfully.");
    } catch (error) {
        console.error("Error loading face-api.js models:", error);
        throw error; // ส่งต่อข้อผิดพลาดให้ตัวเรียกใช้งาน
    }
}
