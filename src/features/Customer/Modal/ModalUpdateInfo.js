import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2'; // นำเข้า SweetAlert2

export default function ModalUpdateInfo({ isOpen, onClose, onSubmit }) {
    const { profile, customerinfo, isLoading, error } = useSelector((state) => state.user);
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

    // State สำหรับจัดการข้อผิดพลาด
    const [errors, setErrors] = useState({
        first_name: '',
        last_name: '',
        user_code: '',
        group_st: '',
        branch_st: '',
        levelST: '',
    });

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // กำหนด RegEx สำหรับการตรวจสอบ
        let regex;
        let isValid = true;
        let errorMessage = '';

        switch (name) {
            case 'first_name':
            case 'last_name':
                // ตรวจสอบว่าเป็นตัวอักษรไทยเท่านั้น
                regex = /^[\u0E00-\u0E7F\s]+$/;
                isValid = regex.test(value);
                if (!isValid && value !== '') {
                    errorMessage = 'กรุณากรอกเฉพาะภาษาไทยเท่านั้น';
                }
                break;
            case 'user_code':
                // ตรวจสอบว่าเป็นตัวเลขและเครื่องหมาย - เท่านั้น
                regex = /^[0-9\-]*$/;
                isValid = regex.test(value);
                if (!isValid && value !== '') {
                    errorMessage = 'กรุณากรอกเฉพาะตัวเลขและเครื่องหมาย - เท่านั้น';
                }
                break;
            case 'levelST':
                // ตรวจสอบว่าเป็นตัวเลขระหว่าง 1 ถึง 8
                const num = Number(value);
                if (value === '') {
                    isValid = false;
                    errorMessage = 'กรุณากรอกนักศึกษาปีที่';
                } else if (isNaN(num) || num < 1 || num > 8) {
                    isValid = false;
                    errorMessage = 'กรุณากรอกตัวเลขระหว่าง 1 ถึง 8';
                }
                break;
            case 'group_st':
                // เมื่อเลือกคณะ ต้องเคลียร์ค่า branch_st
                isValid = true;
                break;
            default:
                isValid = true;
        }

        if (isValid) {
            setFormData(prevData => ({
                ...prevData,
                [name]: value,
                // หากเปลี่ยน group_st, ให้เคลียร์ branch_st
                ...(name === 'group_st' ? { branch_st: '' } : {})
            }));
            setErrors(prevErrors => ({
                ...prevErrors,
                [name]: '',
                ...(name === 'group_st' ? { branch_st: '' } : {})
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: '' // รีเซ็ตฟิลด์เป็นค่าว่างเมื่อเกิดข้อผิดพลาด
            }));
            setErrors(prevErrors => ({
                ...prevErrors,
                [name]: errorMessage,
            }));

            // แสดง Swal.fire เมื่อมีข้อผิดพลาดในแต่ละฟิลด์
            Swal.fire({
                icon: 'error',
                title: 'ข้อผิดพลาด',
                text: errorMessage,
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timerProgressBar: true
            });
        }
    };

    useEffect(() => {
        if (profile) {
            setFormData(prevData => ({
                ...prevData,
                customer_id: profile.userId || '',
            }));
        }
    }, [profile]);

    const handleSubmit = () => {
        // ตรวจสอบก่อนส่งฟอร์มว่ามีข้อผิดพลาดหรือไม่
        const hasErrors = Object.values(errors).some(error => error !== '');
        if (hasErrors) {
            Swal.fire({
                icon: 'error',
                title: 'ข้อผิดพลาด',
                text: 'กรุณาแก้ไขข้อผิดพลาดก่อนส่งฟอร์ม',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timerProgressBar: true
            });
            return;
        }

        // ตรวจสอบว่าข้อมูลที่จำเป็นถูกกรอกหรือไม่
        if (
            !formData.first_name ||
            !formData.last_name ||
            !formData.user_code ||
            !formData.group_st ||
            !formData.branch_st || // เพิ่มการตรวจสอบ branch_st
            !formData.tpye_st ||
            !formData.st_tpye ||
            !formData.levelST
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timerProgressBar: true
            });
            return;
        }

        onSubmit(formData);
        onClose();

        // แสดงการบันทึกสำเร็จ
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
            <div className="bg-white w-1/2 max-lg:w-[80%] p-4 rounded-lg shadow-lg">
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
                    onChange={handleInputChange}
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
                    disabled={!formData.group_st} // ปิดใช้งานถ้ายังไม่ได้เลือกคณะ
                >
                    <option value="" disabled>เลือกสาขา</option>
                    {formData.group_st && branchOptionsMap[formData.group_st]?.map((branch, index) => (
                        <option key={index} value={branch}>{branch}</option>
                    ))}
                </select>
                {errors.branch_st && <p className="text-red-500 text-sm mb-2">{errors.branch_st}</p>}
                
                {/* สาขาเพิ่มเติมถ้าจำเป็น */}
                
                {/* <input
                    type="text"
                    name="branch_st_other"
                    placeholder="สาขา (ถ้าไม่พบในตัวเลือก)"
                    value={formData.branch_st_other || ''}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                    disabled={!!formData.branch_st} // เปิดใช้งานเมื่อไม่ได้เลือกใน select
                /> */}

                {/* ระดับ (select) */}
                <select
                    name="tpye_st"
                    value={formData.tpye_st}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                >
                    <option value="" disabled>เลือกระดับการศึกษา</option>
                    <option value="ปวช.">ปวช.</option>
                    <option value="ปวส.">ปวส.</option>
                    <option value="ป.ตรี">ป.ตรี</option>
                </select>

                {/* ประเภทนักศึกษา (select) */}
                <select
                    name="st_tpye"
                    value={formData.st_tpye}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                >
                    <option value="" disabled>เลือกประเภทนักศึกษา</option>
                    <option value="ทั่วไป">ทั่วไป</option>
                    <option value="กยศ.">กยศ.</option>
                </select>

                {/* นักศึกษาปีที่ (ตัวเลข 1-8) */}
                <input
                    type="number"
                    name="levelST"
                    placeholder="นักศึกษาปีที่"
                    value={formData.levelST}
                    onChange={handleInputChange}
                    min="1"
                    max="8"
                    className={`border p-2 mb-2 w-full rounded-md ${errors.levelST ? 'border-red-500' : ''}`}
                />
                {errors.levelST && <p className="text-red-500 text-sm mb-2">{errors.levelST}</p>}

                <div className="flex justify-center items-center gap-2">
                    <button onClick={handleSubmit} className="bg-blue-500 text-white rounded-md px-4 py-2">
                        บันทึก
                    </button>
                    <button onClick={onClose} className="bg-gray-300 text-black rounded-md px-4 py-2">
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
};
