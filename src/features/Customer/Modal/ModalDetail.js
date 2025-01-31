import React ,{ useState } from 'react';
import './modal.css'
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; // import Leaflet
import 'leaflet/dist/leaflet.css';

const ModalDetail = ({ isOpen, onClose, activity }) => {
    const [isImagesOpen, setIsImagesOpen] = useState(false);
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className='font-bold text-xl'>รายละเอียดกิจกรรม</h2>
                <div className="grid grid-cols-2 my-2">
                    <label htmlFor="">
                        <p className='font-bold text-[1rem]'>กิจกรรม</p>
                        <p>{activity.activityName}</p>
                    </label>

                    <label htmlFor="">
                        <p className='font-bold text-[1rem]'>วันที่เริ่มทำกิจกรรม</p>
                        <p>{activity.startDate ? format(new Date(activity.startDate), "d MMM yyyy", { locale: th }) : '-'}</p>
                    </label>

                    <label htmlFor="">
                        <p className='font-bold text-[1rem]'>สถานที่ทำกิจกรรม</p>
                        <p>{activity.Nameplace}</p>
                    </label>

                    <label htmlFor="">
                        <p className='font-bold text-[1rem]'>สถานะการเข้าร่วม</p>
                        <p>{activity.status}</p>
                    </label>

                </div>

                {registrationImages && registrationImages.length > 0 && (
                    <div className="my-4">
                        <button 
                            className="bg-blue-500 text-white px-4 py-2 rounded-md"
                            onClick={() => setIsImagesOpen(!isImagesOpen)}
                        >
                            {isImagesOpen ? "ซ่อนรูปภาพ" : "ดูรูปภาพที่ลงทะเบียน"}
                        </button>

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
                    </div>
                )}

                {latitude && longitude ? (
                    <div className="my-4">
                        <MapContainer
                            center={[lat, lng]} // Use numbers for latitude and longitude
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
                ) : (
                    <div className="my-4">
                        <p>ไม่มีข้อมูลพิกัดแผนที่</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <button onClick={onClose} className='btn border-gray-400'>ปิด</button>
                </div>
            </div>
            {selectedImage && (
                <div className="modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex items-center justify-center" onClick={() => setSelectedImage(null)}>
                    <div className="relative bg-white p-2 rounded-lg shadow-lg max-w-3xl">
                        <button className="absolute top-2 right-2 text-white bg-red-500 px-3 py-1 rounded-md" onClick={() => setSelectedImage(null)}>
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
