import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const videoConstraints = {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 }
};

function dataURLtoFile(dataURL, fileName) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
}

const ModalFaceUpload = ({ isOpen, onClose, onSubmit, profile }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [customerId, setCustomerId] = useState('');
    const [imageSrc, setImageSrc] = useState(null); // base64 จาก react-webcam
    const [status, setStatus] = useState(null); // สถานะการตรวจสอบภาพ
    const [isProcessing, setIsProcessing] = useState(false); // สถานะการประมวลผล
    const [countdown, setCountdown] = useState(null); // นับถอยหลังสำหรับการถ่ายรูปอัตโนมัติ
    const [capturedImage, setCapturedImage] = useState(null); // เพิ่มตัวแปร capturedImage ที่นี่
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refStatus, setRefStatus] = useState(null);

    useEffect(() => {
        if (profile) {
            setCustomerId(profile.userId || '');
        }
    }, [profile]);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models'; // ที่อยู่ของโมเดล face-api.js
            await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        };

        loadModels();
    }, []);

    // ฟังก์ชันตรวจสอบใบหน้าแบบเรียลไทม์
    const handleVideoOnPlay = useCallback(async () => {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };

        faceapi.matchDimensions(canvas, displaySize);

        // กำหนดจุดศูนย์กลางของวิดีโอและรัศมี
        const centerX = displaySize.width / 2;
        const centerY = displaySize.height / 2;
        const regionRadius = Math.min(displaySize.width, displaySize.height) * 0.1; // ปรับได้ตามต้องการ

        const isFaceInCenter = (box) => {
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const dx = faceCenterX - centerX;
            const dy = faceCenterY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= regionRadius;
        };

        const interval = setInterval(async () => {
            if (video.paused || video.ended) {
                clearInterval(interval);
                return;
            }

            if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
                return; // รอให้ video พร้อม
            }

            // ตรวจจับใบหน้า
            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 640, scoreThreshold: 0.5 })
            );

            let currentStatus = '';
            if (detections.length === 1) {
                // ตรวจจับใบหน้าพร้อม landmarks เพื่อดึงข้อมูลดวงตา
                const detectionWithLandmarks = await faceapi
                  .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 640, scoreThreshold: 0.5 }))
                  .withFaceLandmarks();
              
                if (detectionWithLandmarks) {
                  const landmarks = detectionWithLandmarks.landmarks;
                  const leftEye = landmarks.getLeftEye();
                  const rightEye = landmarks.getRightEye();
              
                  if (leftEye.length === 0 || rightEye.length === 0) {
                    currentStatus = 'ไม่พบดวงตาในใบหน้า';
                  } else {
                    // คำนวณตำแหน่งเฉลี่ยของดวงตาทั้งสอง
                    const leftEyeXAvg = leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length;
                    const leftEyeYAvg = leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length;
                    const rightEyeXAvg = rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length;
                    const rightEyeYAvg = rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length;
              
                    // คำนวณมุมเอียงของเส้นเชื่อมระหว่างดวงตา
                    const dy = rightEyeYAvg - leftEyeYAvg;
                    const dx = rightEyeXAvg - leftEyeXAvg;
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              
                    if (Math.abs(angle) > 15) {
                      currentStatus = 'ใบหน้าต้องเป็นหน้าตรง';
                    } else {
                      // ตรวจสอบว่าหน้าอยู่กลางจอหรือไม่ (ใช้ฟังก์ชัน isFaceInCenter ที่มีอยู่)
                      if (isFaceInCenter(detectionWithLandmarks.detection.box)) {
                        const isClear = await isImageClear(video);
                        currentStatus = isClear ? 'ใช้ได้' : 'ไม่ใช้ได้';
                      } else {
                        currentStatus = 'กรุณานำใบหน้ามาอยู่กลางจอ';
                      }
                    }
                  }
                } else {
                  currentStatus = 'ไม่พบใบหน้า';
                }
              } else {
                currentStatus = 'ไม่พบใบหน้าหรือพบมากกว่า 1 ใบหน้า';
              }
              
            setStatus(currentStatus);

            // วาด bounding box + วงกลม
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // mirror ภาพบน canvas ให้ตรงกับเว็บแคม (ที่ scaleX(-1))
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);

            // วาด bounding box
            faceapi.draw.drawDetections(canvas, resizedDetections);

            // วาดวงกลมกลางจอ (ต้องเป็น -centerX เพราะ x กลับด้าน)
            ctx.beginPath();
            ctx.arc((displaySize.width / 7.2), (displaySize.height / 7), regionRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }, 500);

        return () => clearInterval(interval);
    }, []);


    // ฟังก์ชันตรวจสอบความเบลอของภาพ
    const isImageClear = (video) => {
        return new Promise((resolve) => {

            if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
                resolve(false);
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let variance = 0;
            let mean = 0;
            const len = data.length;

            // คำนวณค่าเฉลี่ยสี
            for (let i = 0; i < len; i += 4) {
                const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
                mean += gray;
            }
            mean /= len / 4;

            // คำนวณความแปรผันของสี
            for (let i = 0; i < len; i += 4) {
                const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
                variance += Math.pow(gray - mean, 2);
            }
            variance /= len / 4;



            const BLUR_THRESHOLD = 150; // ปรับเกณฑ์ให้ตรวจจับได้ชัดเจนขึ้น
            resolve(variance > BLUR_THRESHOLD);
        });
    };

    // ฟังก์ชันถ่ายรูปจากกล้อง
    const handleCapture = () => {
        if (webcamRef.current) {
            const screenshot = webcamRef.current.getScreenshot();
            const img = new Image();
            img.src = screenshot;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // const scaleFactor = 2;
                canvas.width = img.width;
                canvas.height = img.height;
                // canvas.width = img.width * scaleFactor;
                // canvas.height = img.height * scaleFactor;
                // ctx.scale(scaleFactor, scaleFactor);
                ctx.drawImage(img, 0, 0);
                // const correctedScreenshot = canvas.toDataURL('image/jpeg', 0.9);
                const correctedScreenshot = canvas.toDataURL('image/png');
                setImageSrc(correctedScreenshot);
                setImageSrc(correctedScreenshot);
                setCapturedImage(correctedScreenshot);
                setCountdown(null);
            };
        }
        setIsSubmitting(false);
    };

    useEffect(() => {
        if (imageSrc) {
            async function checkCapturedImage() {
                try {
                    // ใช้ faceapi.fetchImage สำหรับ data URL ที่ได้จาก imageSrc
                    const img = await faceapi.fetchImage(imageSrc);
                    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
                        inputSize: 512,
                        scoreThreshold: 0.5,
                    });
                    const detection = await faceapi
                        .detectSingleFace(img, detectionOptions)
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                    if (detection) {
                        console.log("Face detected in captured image:", detection);
                    } else {
                        setStatus("ใบหน้าไม่ชัด กรุณาถ่ายใหม่");
                    }
                } catch (error) {
                    console.error("Error detecting face in captured image:", error);
                    setImageSrc(null);
                }
            }
            checkCapturedImage();
        }
    }, [imageSrc]);


    // ฟังก์ชันบันทึก/อัปโหลด
    const handleSubmit = () => {
        if (!imageSrc) {
            alert('กรุณาถ่ายรูปก่อน');
            return;
        }

        if (status !== 'ใช้ได้') {
            alert('ภาพไม่ชัดเจน กรุณาถ่ายใหม่');
            return;
        }

        setIsSubmitting(true);

        const file = dataURLtoFile(imageSrc, 'face.jpg');

        const formData = new FormData();
        formData.append('images', file); // key "face_image_url"
        formData.append('customer_id', customerId); // key "customer_id"

        onSubmit(formData);
    };

    // ฟังก์ชันสำหรับจับเวลาและถ่ายรูปอัตโนมัติ
    useEffect(() => {
        let timer;
        if (status === 'ใช้ได้') {
            // setCountdown(2);
            // timer = setInterval(() => {
            //     setCountdown((prev) => {
            //         if (prev > 1) return prev - 1;
            //         clearInterval(timer);
                    handleCapture();
            //         return null;
            //     });
            // }, 1000);
        } 
        // else {
        //     setCountdown(null); // รีเซ็ตนับถอยหลังถ้าสถานะไม่ใช่ "ใช้ได้"
        // }

        return () => clearInterval(timer);
    }, [status]);

    if (!isOpen) return null;


    return (
        <div
            className="modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
        // onClick={onClose}
        >
            <div
                className="modal-content bg-white p-4 rounded-lg shadow-lg w-[90%] max-w-md relative"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4">ถ่ายรูปใบหน้า</h2>

                {!imageSrc ? (
                    <>
                        {/* แสดง live camera */}
                        <div className="relative">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/png"
                                videoConstraints={videoConstraints}
                                className="mx-auto rounded-md transform scale-x-[-1]" // สะท้อนภาพ
                                onPlay={handleVideoOnPlay}
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 transform scale-x-[-1]" // สะท้อน canvas ให้ตรงกับวิดีโอ
                                style={{
                                    width: webcamRef.current?.video?.videoWidth,
                                    height: webcamRef.current?.video?.videoHeight,
                                }}
                            />
                        </div>
                        <div className="mt-2 text-center">
                            {status && (
                                <p
                                    className={`${status === 'ใช้ได้' ? 'text-green-500' : 'text-red-500'
                                        }`}
                                >
                                    สถานะ: {status}
                                </p>
                            )}
                            {countdown !== null && (
                                <p className="text-yellow-500">
                                    ถ่ายรูปอัตโนมัติในอีก {countdown} วินาที
                                </p>
                            )}
                        </div>
                        {/* <button
                            onClick={handleCapture}
                            className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded block mx-auto ${status === 'ใช้ได้' ? '' : 'opacity-50 cursor-not-allowed'
                                }`}
                            disabled={status !== 'ใช้ได้'}
                        >
                            ถ่ายรูป
                        </button> */}
                    </>
                ) : (
                    <>
                        {/* แสดงพรีวิวภาพที่ถ่าย */}
                        <img
                            src={imageSrc}
                            alt="Preview"
                            className="w-64 h-auto object-cover rounded-md mx-auto"
                        />
                        {isProcessing ? (
                            <p className="text-center text-blue-500 mt-2">กำลังตรวจสอบภาพ...</p>
                        ) : status ? (
                            <p className={`text-center mt-2 ${status === 'ใช้ได้' ? 'text-green-500' : 'text-red-500'}`}>
                                สถานะ: {status}
                            </p>
                        ) : null}
                        <div className="flex justify-center gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setImageSrc(null);
                                    setStatus(null);
                                }}
                                className="btn border border-gray-400 px-4 py-2 rounded"
                            >
                                ถ่ายใหม่
                            </button>
                            <button
                                onClick={handleSubmit}
                                className={`btn bg-[#FF9C00] text-white px-4 py-2 rounded ${status === 'ใช้ได้' ? '' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                disabled={status !== 'ใช้ได้'}
                            >
                                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </>
                )}

                {/* <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                    X
                </button> */}
            </div>
        </div>
    );
};

export default ModalFaceUpload;
