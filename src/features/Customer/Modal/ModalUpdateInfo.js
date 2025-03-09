import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';

export default function ModalUpdateInfo({ isOpen, onClose, onSubmit }) {
    const { profile, customerinfo } = useSelector((state) => state.user);
    const [formData, setFormData] = useState({
        customer_id: profile?.userId || '',
        first_name: '',
        last_name: '',
        user_code: '',
        group_st: '',
        branch_st: '',
        tpye_st: '',
        st_tpye: '',
        levelST: ''
    });

    // State สำหรับจัดการข้อผิดพลาด (errors จะแสดงเฉพาะเมื่อกด Submit)
    const [errors, setErrors] = useState({
        first_name: '',
        last_name: '',
        user_code: '',
        group_st: '',
        branch_st: '',
        tpye_st: '',
        st_tpye: '',
        levelST: ''
    });

    useEffect(() => {
        if (isOpen && customerinfo) {
            setFormData({
                customer_id: profile?.userId || '',
                first_name: customerinfo.first_name || '',
                last_name: customerinfo.last_name || '',
                user_code: customerinfo.user_code || '',
                group_st: customerinfo.group_st || '',
                branch_st: customerinfo.branch_st || '',
                tpye_st: customerinfo.tpye_st || '',
                st_tpye: customerinfo.st_tpye || '',
                levelST: customerinfo.levelST || ''
            });
            // เคลียร์ errors เมื่อเปิด modal
            setErrors({});
        }
    }, [isOpen, customerinfo, profile]);

    // กำหนดแมปปิ้งระหว่างคณะและสาขา
    const branchOptionsMap = {
        "วิศวกรรมศาสตร์": [
            "วศ.บ.วิศวกรรมเครื่องกล",
            "วศ.บ.วิศวกรรมไฟฟ้า - วิศวกรรมไฟฟ้า",
            "วศ.บ.วิศวกรรมคอมพิวเตอร์",
            "วศ.บ.วิศวกรรมอิเล็กทรอนิกส์และระบบควบคุมอัตโนมัติ",
            "วศ.บ.วิศวกรรมโยธา",
            "วศ.บ.วิศวกรรมอุตสาหการ - วิศวกรรมอุตสาหการ",
            "ค.อ.บ.วิศวกรรมไฟฟ้า - วิศวกรรมไฟฟ้า",
            "ค.อ.บ.วิศวกรรมเครื่องกล",
            "ปวส.ไฟฟ้า",
            "ปวส.เทคนิคคอมพิวเตอร์",
            "ปวส.อิเล็กทรอนิกส์",
            "ปวส.ช่างยนต์",
            "ปวส.ช่างก่อสร้าง",
            "ปวส.ช่างโลหะ",
            "ปวส.ช่างกลโรงงาน",
            "ปวส.ช่างจักรกลหนัก"
        ],
        "บริหารธุรกิจและศิลปศาสตร์": [
            "บธ.บ.บริหารธุรกิจ - การจัดการธุรกิจ",
            "บธ.บ.บริหารธุรกิจ - การตลาดและการตลาดดิจิทัล",
            "บช.บ.การบัญชี- การบัญชี",
            "ศศ.บ.ภาษาอังกฤษเพื่อการสื่อสารสากล",
            "ศศ.บ.การท่องเที่ยวและการบริการ",
            "บธ.บ.บริหารธุรกิจ - การตลาดและการตลาดดิจิทัล ภาคพิเศษ *โครงการร่วม บ.ซีพีออลฯ",
            "ปวส.การจัดการ",
            "ปวส.การตลาด",
            "ปวส.เทคโนโลยีธุรกิจดิจิทัล"
        ],
        "ศิลปกรรมและสถาปัตยกรรมศาสตร์": [
            "ศป.บ.ออกแบบอุตสาหกรรม"
        ],
        "วิทยาศาสตร์และเทคโนโลยีการเกษตร": [
            "วท.บ.เทคโนโลยีสารสนเทศ",
            "วท.บ.ธุรกิจอาหารและโภชนาการ"
        ]
    };

    // handleInputChange จะอัปเดต formData และเคลียร์ error ของ field นั้น (ไม่แสดง error ทันที)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
            ...(name === 'group_st' ? { branch_st: '' } : {})
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: ''
        }));
    };

    // validateForm ตรวจสอบข้อมูลทั้งหมดและ return errors object
    const validateForm = () => {
        const newErrors = {};
        // ตรวจสอบ first_name (ต้องไม่ว่างและเป็นภาษาไทย)
        if (!formData.first_name) {
            newErrors.first_name = 'กรุณากรอกชื่อ';
        } else if (!/^[A-Za-z\u0E00-\u0E7F\s]+$/.test(formData.first_name)) {
            newErrors.first_name = 'ไม่สามารถป้อนตัวอักษรพิเศษได้';
        }

        // ตรวจสอบ last_name (ต้องไม่ว่างและเป็นภาษาไทย)
        if (!formData.last_name) {
            newErrors.last_name = 'กรุณากรอกนามสกุล';
        } else if (!/^[\u0E00-\u0E7F\s]+$/.test(formData.last_name)) {
            newErrors.last_name = 'กรุณากรอกเฉพาะภาษาไทยเท่านั้น';
        }

        // ตรวจสอบ user_code (ต้องไม่ว่างและเป็นตัวเลขหรือ - เท่านั้น)
        if (!formData.user_code) {
            newErrors.user_code = 'กรุณากรอกรหัสนักศึกษา';
        } else if (!/^[0-9]{11}-[0-9]$/.test(formData.user_code)) {
            newErrors.user_code = 'รูปแบบรหัสนักศึกษาควรเป็น ตามตั้วอย่าง(64243206000-0)';
        }

        // ตรวจสอบ group_st
        if (!formData.group_st) {
            newErrors.group_st = 'กรุณาเลือกคณะ';
        }

        // ตรวจสอบ branch_st
        if (!formData.branch_st) {
            newErrors.branch_st = 'กรุณาเลือกสาขา';
        }

        // ตรวจสอบ tpye_st (เลือกระดับการศึกษา)
        if (!formData.tpye_st) {
            newErrors.tpye_st = 'กรุณาเลือกระดับการศึกษา';
        }

        // ตรวจสอบ st_tpye (เลือกประเภทนักศึกษา) หากมี field นี้
        if (!formData.st_tpye) {
            newErrors.st_tpye = 'กรุณาเลือกประเภทนักศึกษา';
        }

        // ตรวจสอบ levelST (ต้องไม่ว่าง และเป็นตัวเลขระหว่าง 1 ถึง 8)
        if (!formData.levelST) {
            newErrors.levelST = 'กรุณากรอกนักศึกษาปีที่';
        } else {
            const num = Number(formData.levelST);
            if (isNaN(num) || num < 1 || num > 8) {
                newErrors.levelST = 'กรุณากรอกตัวเลขระหว่าง 1 ถึง 8';
            }
        }

        return newErrors;
    };

    const handleUserCodeChange = (e) => {
        let { name, value } = e.target;
        value = value.replace(/[^0-9\-]/g, '');

        if (!value.includes('-') && value.length === 11) {
            value = value + '-';
        }

        if (!value.includes('-') && value.length > 11) {
            value = value.slice(0, 11) + '-' + value.slice(11);
        }

        if (value.length > 13) {
            value = value.slice(0, 13);
        }

        let newLevelST = '';
        const digitPart = value.slice(0, 2);
        if (/^\d{2}$/.test(digitPart)) {
            const currentThaiYearLastTwo = (new Date().getFullYear() + 543) % 100;
            newLevelST = currentThaiYearLastTwo - parseInt(digitPart, 10);
        }

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
            levelST: newLevelST
        }));
    };



    const handleSubmit = () => {
        // รัน validateForm เมื่อกด submit
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // ไม่แสดง Swal.fire แบบ toast error เมื่อมี error (จะแสดง inline แทน)
            return;
        }

        onSubmit(formData);
        onClose();

        // แสดง Swal.fire สำหรับความสำเร็จ (สามารถเก็บไว้ได้ตามที่ต้องการ)
        Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'บันทึกข้อมูลสำเร็จ',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
            timerProgressBar: true
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-1/2 max-lg:w-[90%] p-4 rounded-lg shadow-lg">
                <h2 className="text-lg text-center font-bold mb-4">ลงทะเบียน</h2>

                {/* ชื่อ (ภาษาไทยเท่านั้น) */}
                <input
                    type="text"
                    name="first_name"
                    placeholder="ชื่อ"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`border p-2 mb-2 w-full rounded-md ${errors.first_name ? 'border-red-500' : ''}`}
                />
                {errors.first_name && <p className="text-red-500 text-sm mb-2">{errors.first_name}</p>}

                {/* นามสกุล (ภาษาไทยเท่านั้น) */}
                <input
                    type="text"
                    name="last_name"
                    placeholder="นามสกุล"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`border p-2 mb-2 w-full rounded-md ${errors.last_name ? 'border-red-500' : ''}`}
                />
                {errors.last_name && <p className="text-red-500 text-sm mb-2">{errors.last_name}</p>}

                {/* รหัสนักศึกษา (ตัวเลขและ - เท่านั้น) */}
                <input
                    type="text"
                    name="user_code"
                    placeholder="รหัสนักศึกษา"
                    value={formData.user_code}
                    onChange={handleUserCodeChange}
                    className={`border p-2 mb-2 w-full rounded-md ${errors.user_code ? 'border-red-500' : ''}`}
                />
                {errors.user_code && <p className="text-red-500 text-sm mb-2">{errors.user_code}</p>}

                {/* คณะ (select) */}
                <select
                    name="group_st"
                    value={formData.group_st}
                    onChange={handleInputChange}
                    className={`border p-2 mb-2 w-full rounded-md ${errors.group_st ? 'border-red-500' : ''}`}
                >
                    <option value="" disabled>เลือกคณะ</option>
                    <option value="บริหารธุรกิจและศิลปศาสตร์">บริหารธุรกิจและศิลปศาสตร์</option>
                    <option value="วิทยาศาสตร์และเทคโนโลยีการเกษตร">วิทยาศาสตร์และเทคโนโลยีการเกษตร</option>
                    <option value="วิศวกรรมศาสตร์">วิศวกรรมศาสตร์</option>
                    <option value="ศิลปกรรมและสถาปัตยกรรมศาสตร์">ศิลปกรรมและสถาปัตยกรรมศาสตร์</option>
                </select>
                {errors.group_st && <p className="text-red-500 text-sm mb-2">{errors.group_st}</p>}

                {/* สาขา (select) */}
                <select
                    name="branch_st"
                    value={formData.branch_st}
                    onChange={handleInputChange}
                    className={`border p-2 mb-2 w-full rounded-md ${errors.branch_st ? 'border-red-500' : ''}`}
                    disabled={!formData.group_st}
                >
                    <option value="" disabled>เลือกสาขา</option>
                    {formData.group_st && branchOptionsMap[formData.group_st]?.map((branch, index) => (
                        <option key={index} value={branch}>{branch}</option>
                    ))}
                </select>
                {errors.branch_st && <p className="text-red-500 text-sm mb-2">{errors.branch_st}</p>}

                {/* ระดับ (select) */}
                <select
                    name="tpye_st"
                    value={formData.tpye_st}
                    onChange={handleInputChange}
                    className={`border p-2 mb-2 w-full rounded-md ${errors.tpye_st ? 'border-red-500' : ''}`}
                >
                    <option value="" disabled>เลือกระดับการศึกษา</option>
                    <option value="ปวช.">ปวช.</option>
                    <option value="ปวส.">ปวส.</option>
                    <option value="ป.ตรี">ป.ตรี</option>
                </select>
                {errors.tpye_st && <p className="text-red-500 text-sm mb-2">{errors.tpye_st}</p>}

                {/* ประเภทนักศึกษา (select) */}
                {!customerinfo.st_tpye &&
                    <select
                        name="st_tpye"
                        value={formData.st_tpye}
                        onChange={handleInputChange}
                        className={`border p-2 mb-2 w-full rounded-md ${errors.st_tpye ? 'border-red-500' : ''}`}
                    >
                        <option value="" disabled>เลือกประเภทนักศึกษา</option>
                        <option value="ทั่วไป">ทั่วไป</option>
                        <option value="กยศ.">กยศ.</option>
                    </select>}
                {errors.st_tpye && <p className="text-red-500 text-sm mb-2">{errors.st_tpye}</p>}

                {/* นักศึกษาปีที่ (input ตัวเลข) */}
                {/* <input
                    type="number"
                    name="levelST"
                    placeholder="นักศึกษาปีที่"
                    value={formData.levelST}
                    onChange={handleInputChange}
                    min="1"
                    max="8"
                    className={`border p-2 mb-2 w-full rounded-md ${errors.levelST ? 'border-red-500' : ''}`}
                />
                {errors.levelST && <p className="text-red-500 text-sm mb-2">{errors.levelST}</p>} */}

                <div className="flex justify-center items-center gap-2">
                    <button onClick={handleSubmit} className="bg-blue-500 text-white rounded-md px-4 py-2">
                        บันทึก
                    </button>
                    <button onClick={onClose} disabled={!customerinfo.st_tpye} className="bg-gray-300 text-black rounded-md px-4 py-2">
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
}
