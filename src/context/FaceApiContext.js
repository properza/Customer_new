// src/context/FaceApiContext.js

import React, { createContext, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import Swal from 'sweetalert2';

export const FaceApiContext = createContext();

export const FaceApiProvider = ({ children }) => {
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        async function loadModels() {
            const MODEL_URL = process.env.PUBLIC_URL + '/models';
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                setModelsLoaded(true);
                console.log("face-api.js models loaded successfully.");
            } catch (error) {
                console.error("Error loading face-api.js models:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'การโหลดโมเดลล้มเหลว',
                    text: 'ไม่สามารถโหลดโมเดลสำหรับตรวจจับใบหน้าได้ กรุณาลองใหม่อีกครั้งภายหลัง',
                });
            }
        }

        loadModels();
    }, []);

    return (
        <FaceApiContext.Provider value={{ modelsLoaded }}>
            {children}
        </FaceApiContext.Provider>
    );
};
