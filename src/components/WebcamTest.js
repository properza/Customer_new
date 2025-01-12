// src/components/WebcamTest.js
import React from 'react';
import Webcam from 'react-webcam';

const videoConstraints = {
    facingMode: "user",
};

const WebcamTest = () => {
    return (
        <div>
            <h2>ทดสอบ Webcam</h2>
            <Webcam
                audio={false}
                height={400}
                width={400}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
            />
        </div>
    );
};

export default WebcamTest;
