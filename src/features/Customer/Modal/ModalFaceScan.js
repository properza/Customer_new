// src/features/common/Modal/ModalFaceScan.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import Swal from 'sweetalert2';

const videoConstraints = {
    facingMode: 'user',
};

function ModalFaceScan({ isOpen, onClose, faceUrl, onSuccess }) {
    const webcamRef = useRef(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [refDescriptor, setRefDescriptor] = useState(null);
    const [isWebcamReady, setIsWebcamReady] = useState(false);
    const [hasVerified, setHasVerified] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [referenceImage, setReferenceImage] = useState(null);

    useEffect(() => {
        async function loadModels() {
            try {
                const MODEL_URL = '/models';
                console.log("Loading face-api models from:", MODEL_URL);
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                setIsModelsLoaded(true);
                console.log("face-api models loaded successfully");
            } catch (error) {
                console.error("Error loading face-api models:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาดในการโหลดโมเดล',
                    text: 'กรุณาลองอีกครั้ง',
                });
                onClose();
            }
        }
        if (isOpen) {
            loadModels();
        }
    }, [onClose, isOpen]);

    useEffect(() => {
        if (!isModelsLoaded || !faceUrl) return;

        async function fetchReferenceDescriptor() {
            try {
                const refImgElement = await faceapi.fetchImage(faceUrl);
                setReferenceImage(faceUrl);

                const detectionOptions = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512,
                    scoreThreshold: 0.5,
                });

                const detection = await faceapi
                    .detectSingleFace(refImgElement, detectionOptions)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    console.log("Reference Face Detected:", detection);
                    setRefDescriptor(detection.descriptor);
                } else {
                    console.warn("No face detected in reference image at URL:", faceUrl);
                    Swal.fire({
                        icon: 'error',
                        title: 'ไม่พบใบหน้าในรูปอ้างอิง',
                        text: 'กรุณาอัปโหลดรูปใบหน้าใหม่ที่มีใบหน้าชัดเจน',
                    });
                    onClose();
                }
            } catch (error) {
                console.error("Error fetching reference image descriptor:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาดในการโหลดรูปอ้างอิง',
                    text: 'กรุณาตรวจสอบ URL หรือ Backend',
                });
                onClose();
            }
        }

        fetchReferenceDescriptor();
    }, [isModelsLoaded, faceUrl, onClose]);

    useEffect(() => {
        if (isModelsLoaded && refDescriptor && isWebcamReady && !hasVerified && isOpen) {
            console.log("All conditions met. Starting face verification.");
            verifyFace();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModelsLoaded, refDescriptor, isWebcamReady, hasVerified, isOpen]);

    const verifyFace = useCallback(async () => {
        setHasVerified(true); // Prevent re-verification
        try {
            if (!webcamRef.current) {
                console.error("Webcam ref is null");
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถเข้าถึงกล้องได้',
                    text: 'กรุณาเปิดกล้องใหม่และลองอีกครั้ง',
                });
                return;
            }

            const video = webcamRef.current.video;
            if (!video) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่พบวิดีโอจากกล้อง',
                });
                return;
            }

            console.log("Video width:", video.videoWidth);
            console.log("Video height:", video.videoHeight);

            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.warn("Video not ready yet. Dimensions are zero. Retrying in 500ms...");
                setTimeout(verifyFace, 500); // Retry after 500ms
                return;
            }

            // Create a canvas to capture the frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const screenshot = canvas.toDataURL('image/jpeg');
            console.log("Captured screenshot via canvas:", screenshot);
            if (!screenshot || screenshot === "data:,") {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถถ่ายรูปได้',
                });
                setHasVerified(false);
                return;
            }

            // Save captured image
            setCapturedImage(screenshot);

            // Fetch probe image
            const probeImgElement = await faceapi.fetchImage(screenshot);
            console.log("Fetched probe image");

            // Define detection options
            const detectionOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 512,
                scoreThreshold: 0.5,
            });

            // Detect face in probe image
            const probeDetection = await faceapi
                .detectSingleFace(probeImgElement, detectionOptions)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!probeDetection) {
                // await Swal.fire({
                //     icon: 'error',
                //     title: 'ไม่พบใบหน้าในรูปที่ถ่าย',
                // });
                setHasVerified(false); // Allow re-verification
                setCapturedImage(null); // Reset captured image
                return;
            }

            console.log("Probe Detection:", probeDetection);

            // Compare descriptors
            const distance = faceapi.euclideanDistance(refDescriptor, probeDetection.descriptor);
            console.log("Distance:", distance);

            const threshold = 0.6;
            if (distance < threshold) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ใบหน้าตรงกัน!',
                    showConfirmButton: false,
                    timer: 1500,
                });
                onClose();
                onSuccess();
            } else {
                // await Swal.fire({
                //     icon: 'error',
                //     title: 'ใบหน้าไม่ตรงกัน!',
                //     showConfirmButton: false,
                //     timer: 1500,
                // });
                setHasVerified(false); // Allow re-verification
                setCapturedImage(null); // Reset captured image
            }
        } catch (error) {
            console.error("Error verifying face:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า',
                text: 'กรุณาลองอีกครั้ง',
            });
            setHasVerified(false); // Allow re-verification
        }
    }, [refDescriptor, onClose, onSuccess]);

    const handleUserMedia = () => {
        console.log("Webcam is ready");
        setIsWebcamReady(true);
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="modal-content bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md relative"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4">สแกนใบหน้าเพื่อยืนยัน</h2>
                {!isModelsLoaded || !refDescriptor ? (
                    <p>กำลังโหลดโมเดลหรือรูปอ้างอิง<span className="loading loading-dots loading-sm"></span></p>
                ) : (
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            onUserMedia={handleUserMedia}
                            onUserMediaError={(error) => {
                                console.error("Webcam error:", error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'เกิดข้อผิดพลาดในการเข้าถึงกล้อง',
                                    text: 'กรุณาเปิดกล้องและลองอีกครั้ง',
                                });
                                onClose();
                            }}
                            className="mx-auto rounded-md transform scale-x-[-1]"
                            style={{ width: '100%', height: 'auto' }}
                        />
                        <p className="mt-4 text-center">ระบบกำลังตรวจจับใบหน้า...</p>
                        {/* {capturedImage && (
                            <div className="mt-4">
                                <h3 className="text-md font-semibold">ภาพที่ถ่าย:</h3>
                                <img src={capturedImage} alt="Captured" className="w-full h-auto rounded-md" />
                            </div>
                        )} */}
                        {/* {referenceImage && (
                            <div className="mt-4">
                                <h3 className="text-md font-semibold">ภาพอ้างอิง:</h3>
                                <img src={referenceImage} alt="Reference" className="w-full h-auto rounded-md" />
                            </div>
                        )} */}
                    </>
                )}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                    X
                </button>
            </div>
        </div>
    );
}

export default ModalFaceScan;
