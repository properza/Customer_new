import React, { useState } from 'react';
import './modal.css';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ModalDetail = ({ isOpen, onClose, activity }) => {
    const [isImagesOpen, setIsImagesOpen] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    if (!isOpen || !activity) return null;

    const { latitude, longitude, activityName, registrationImages, startDate, Nameplace } = activity;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const icon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
    });

    return (
        <div className="modal-overlay" >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className='font-bold text-xl'>รายละเอียดกิจกรรม</h2>
                <div className="grid grid-cols-2 my-2">
                    <label>
                        <p className='font-bold text-[1rem]'>กิจกรรม</p>
                        <p>{activity.activityName}</p>
                    </label>

                    <label>
                        <p className='font-bold text-[1rem]'>วันที่เริ่มทำกิจกรรม</p>
                        <p>{activity.startDate ? format(new Date(activity.startDate), "d MMM yyyy", { locale: th }) : '-'}</p>
                    </label>

                    <label>
                        <p className='font-bold text-[1rem]'>สถานที่ทำกิจกรรม</p>
                        <p>{activity.Nameplace}</p>
                    </label>

                    <label>
                        <p className='font-bold text-[1rem]'>สถานะการเข้าร่วม</p>
                        <p>{activity.status}</p>
                    </label>
                </div>

                {/* ปุ่ม Toggle ควบคุมแสดงแผนที่ & รูปภาพ */}
                <div className="grid grid-cols-2 gap-4 my-4 w-full">
                    {registrationImages && registrationImages.length > 0 && (
                        <button 
                            className={`px-4 py-2 w-full rounded-md text-white bg-[#FF9D03] ${isImagesOpen ? "bg-orange-200" : ""}`}
                            onClick={() => {
                                setIsImagesOpen(!isImagesOpen);
                                setIsMapOpen(false); // ปิดแผนที่เมื่อแสดงรูป
                            }}
                        >
                            {isImagesOpen ? "ซ่อนรูปภาพ" : "ดูรูปภาพที่ลงทะเบียน"}
                        </button>
                    )}

                    {latitude && longitude && (
                        <button 
                            className={`px-4 py-2 w-full rounded-md text-white bg-[#FF9D03] ${isMapOpen ? "bg-orange-200" : ""}`}
                            onClick={() => {
                                setIsMapOpen(!isMapOpen);
                                setIsImagesOpen(false); // ปิดรูปเมื่อแสดงแผนที่
                            }}
                        >
                            {isMapOpen ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                        </button>
                    )}
                </div>

                {/* แสดงรูปถ้า isImagesOpen เป็น true */}
                {isImagesOpen && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                        {registrationImages.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`registration-img-${index}`}
                                className="w-24 h-24 object-cover rounded-md cursor-pointer"
                                onClick={() => setSelectedImage(img)}
                            />
                        ))}
                    </div>
                )}

                {/* แสดงแผนที่ถ้า isMapOpen เป็น true */}
                {isMapOpen && (
                    <div className="my-4">
                        <MapContainer
                            center={[lat, lng]}
                            zoom={13}
                            style={{ height: '300px', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[lat, lng]} icon={icon}>
                                <Popup>{activityName}</Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                )}

                <div className="flex justify-end">
                    <button onClick={onClose} className='btn border-gray-400'>ปิด</button>
                </div>
            </div>

            {/* Modal สำหรับขยายรูปภาพ */}
            {selectedImage && (
                <div className="modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex items-center justify-center" onClick={() => setSelectedImage(null)}>
                    <div className="relative bg-white p-2 rounded-lg shadow-lg max-w-3xl">
                        <button className="absolute top-1 right-1 text-white bg-red-500 px-3 py-1 rounded-md" onClick={() => setSelectedImage(null)}>
                            X
                        </button>
                        <img src={selectedImage} alt="Expanded View" className="max-w-full max-h-[80vh] object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalDetail;
