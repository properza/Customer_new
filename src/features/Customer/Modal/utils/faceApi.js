import * as faceapi from 'face-api.js';

export async function loadModels() {
    const MODEL_URL = process.env.PUBLIC_URL + '/models'; // ตรวจสอบให้แน่ใจว่าเส้นทางถูกต้อง
    console.log("MODEL URL: ", MODEL_URL); // Log to ensure the URL is correct
    try {
        if (!faceapi.nets.tinyFaceDetector || !faceapi.nets.faceLandmark68Net || !faceapi.nets.faceRecognitionNet) {
            throw new Error("One of the models is not defined properly in face-api.js.");
        }
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("face-api.js models loaded successfully.");
    } catch (error) {
        console.error("Error loading face-api.js models:", error);
        throw error; // ส่งต่อข้อผิดพลาดให้ตัวเรียกใช้งาน
    }
}
 