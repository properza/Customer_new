import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import Swal from 'sweetalert2';
import 'font-awesome/css/font-awesome.min.css';

const videoConstraints = {
    facingMode: 'user', // กล้องหน้า (mobile)
};

const passIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
;
const UnpassIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
;

function ModalFaceScan({ isOpen, onClose, faceUrl, onSuccess }) {
    const webcamRef = useRef(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [refDescriptor, setRefDescriptor] = useState(null);
    const [isWebcamReady, setIsWebcamReady] = useState(false);
    const [hasVerified, setHasVerified] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [referenceImage, setReferenceImage] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isBrowserSupported, setIsBrowserSupported] = useState(true);
    const [icon, setIcon] = useState(null); // state สำหรับการแสดงไอคอน
    const [iconMessage, setIconMessage] = useState(''); // ข้อความที่จะแสดง
    const maxRetries = 50; // จำนวนครั้งสูงสุดในการลองใหม่

    useEffect(() => {
        async function loadModels() {
            try {
                const MODEL_URL = '/models'; // URL สำหรับโหลดโมเดล face-api.js
                console.log("Loading face-api models from:", MODEL_URL);
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // ใช้โมเดล DNN สำหรับความแม่นยำสูง
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                setIsModelsLoaded(true);
                console.log("face-api models loaded successfully");
            } catch (error) {
                console.error("Error loading face-api models:", error);
                setIcon('error');  // แสดงไอคอน error
                setIconMessage('เกิดข้อผิดพลาดในการโหลดโมเดล');
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาดในการโหลดโมเดล',
                    text: 'กรุณาลองอีกครั้ง',
                });
                handleCloseModal();
            }
        }

        // ตรวจสอบการสนับสนุน getUserMedia
        if (isOpen) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setIsBrowserSupported(false);
            } else {
                setIsBrowserSupported(true);
                loadModels();
            }
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isModelsLoaded || !faceUrl) return;

        async function fetchReferenceDescriptor() {
            try {
                // ตรวจสอบว่า faceUrl เป็น array หรือ string
                const refImgUrl = Array.isArray(faceUrl) ? faceUrl[0] : faceUrl;
                const refImgElement = await faceapi.fetchImage(refImgUrl);
                setReferenceImage(refImgUrl);

                const detectionOptions = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512, // ขนาดอินพุตเพื่อเพิ่มความแม่นยำ
                    scoreThreshold: 0.5, // ค่าความไวของการตรวจจับ
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
                        timer: 1500,
                        showConfirmButton: false
                    });
                    handleCloseModal();
                }
            } catch (error) {
                console.error("Error fetching reference image descriptor:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาดในการโหลดรูปอ้างอิง',
                    text: 'กรุณาตรวจสอบ URL หรือ Backend',
                    timer: 1500,
                    showConfirmButton: false
                });
                handleCloseModal();
            }
        }

        fetchReferenceDescriptor();
    }, [isModelsLoaded, faceUrl, onClose]);

    useEffect(() => {
        if (isModelsLoaded && refDescriptor && isWebcamReady && !hasVerified && isOpen && isBrowserSupported) {
            console.log("All conditions met. Starting face verification.");
            verifyFace();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModelsLoaded, refDescriptor, isWebcamReady, hasVerified, isOpen, isBrowserSupported]);

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
                if (retryCount < maxRetries) {
                    console.warn("Video not ready yet. Dimensions are zero. Retrying in 500ms...");
                    setTimeout(verifyFace, 500); // Retry after 500ms
                    setRetryCount(prev => prev + 1);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'ไม่สามารถเข้าถึงกล้องได้',
                        text: 'กรุณาเปิดกล้องใหม่และลองอีกครั้ง',
                        timer: 1500,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end',
                        timerProgressBar: true
                    });
                }
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
                setHasVerified(false); // Allow re-verification
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
                // Swal.fire({
                //     icon: 'error',
                //     title: 'ไม่พบใบหน้าในรูปที่ถ่าย',
                //     text: 'กรุณาถ่ายรูปใหม่ที่มีใบหน้าชัดเจน',
                //     timer: 1500,
                //     showConfirmButton: false,
                //     toast: true,
                //     position: 'top-end',
                //     timerProgressBar: true
                // });

                setHasVerified(false); // Allow re-verification
                setCapturedImage(null); // Reset captured image
                return;
            }

            console.log("Probe Detection:", probeDetection);

            // Compare descriptors
            const distance = faceapi.euclideanDistance(refDescriptor, probeDetection.descriptor);
            console.log("Distance:", distance);

            const threshold = 0.4; // ลดค่าความคลาดเคลื่อนเพื่อเพิ่มความแม่นยำ
            if (distance < threshold) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ยืนยันใบหน้าสำเร็จ!',
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true,
                    position: 'top-end',
                    timerProgressBar: true
                });
                // await setIcon('success');  // แสดงไอคอน success
                // setIconMessage('ใบหน้าตรงกัน!');
                handleCloseModal();
                onSuccess();
            } else {
                // Swal.fire({
                //     icon: 'error',
                //     title: 'ใบหน้าไม่ตรงกัน!',
                //     text: 'กรุณาถ่ายรูปใหม่',
                //     timer: 1500,
                //     showConfirmButton: false,
                //     toast: true,
                //     position: 'top-end',
                //     timerProgressBar: true
                // });
                setIcon('error');  // แสดงไอคอน error
                setIconMessage('ใบหน้าไม่ตรงกัน! กรุณาถ่ายรูปใหม่');
                setHasVerified(false); // Allow re-verification
                setCapturedImage(null); // Reset captured image
            }
        } catch (error) {
            console.error("Error verifying face:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า',
                text: 'กรุณาลองอีกครั้ง',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timerProgressBar: true
            });
            setHasVerified(false); // Allow re-verification
        }
    }, [refDescriptor, onClose, onSuccess, retryCount]);

    const handleUserMedia = () => {
        console.log("Webcam is ready");
        setIsWebcamReady(true);
    };

    // ฟังก์ชันรีเซ็ตสถานะเมื่อปิดโมดัล
    const handleCloseModal = () => {
        onClose();
        setRetryCount(0);
        setHasVerified(false);
        setCapturedImage(null);
        setReferenceImage(null);
        setIcon(null);  // รีเซ็ตไอคอน
        setIconMessage(''); // รีเซ็ตข้อความ
    };

    // ฟังก์ชันสำหรับเปิดแท็บใหม่ในเว็บเบราว์เซอร์ที่รองรับ
    const openInSupportedBrowser = () => {
        window.open(window.location.href, '_blank');
        handleCloseModal();
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
        // onClick={handleCloseModal}
        >
            <div
                className="modal-content bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md !z-10 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4">สแกนใบหน้าเพื่อยืนยัน</h2>
                {icon && (
                    <div className={`flex justify-center flex-col gap-1 items-center ${icon === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        <div className="w-6 h-6">{icon === 'success' ? passIcon : UnpassIcon }</div>
                        <p className="ml-2">{iconMessage}</p>
                    </div>
                )}

                {!isBrowserSupported ? (
                    <div className="text-center">
                        <p>เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงกล้องสำหรับการยืนยันใบหน้า</p>
                        <p>โปรดเปิดในเว็บเบราว์เซอร์ที่รองรับ เช่น Google Chrome, Mozilla Firefox หรือ Safari</p>
                        <button
                            onClick={openInSupportedBrowser}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            เปิดในเว็บเบราว์เซอร์ที่รองรับ
                        </button>
                    </div>
                ) : (!isModelsLoaded || !refDescriptor ? (
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
                                    title: 'ไม่สามารถเข้าถึงกล้องได้',
                                    text: 'กรุณาเปิดกล้องใหม่และลองอีกครั้ง',
                                    showCancelButton: true,
                                    confirmButtonText: 'เปิดในเว็บเบราว์เซอร์ที่รองรับ',
                                    cancelButtonText: 'ปิด',
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        openInSupportedBrowser();
                                    }
                                });
                                handleCloseModal();
                            }}
                            className="mx-auto rounded-md transform scale-x-[-1]"
                            style={{ width: '100%', height: 'auto' }}
                        />
                        <p className="mt-4 text-center">ระบบกำลังตรวจจับใบหน้า...</p>
                    </>
                ))}
                {/* <button
                    onClick={handleCloseModal}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                    X
                </button> */}
            </div>
        </div>
    );
}

export default ModalFaceScan;
