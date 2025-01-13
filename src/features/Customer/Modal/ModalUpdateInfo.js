import React,{ useState , useEffect } from 'react'

export default function ModalUpdateInfo({isOpen , onClose , onSubmit , profile}) {
    const [formData, setFormData] = useState({
        customer_id: profile?.userId || '',
        first_name: '',
        last_name: '',
        user_code: '',
        group_st: '',
        branch_st: '',
        tpye_st: '',
        st_tpye:'',
        levelST:''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    useEffect(() => {
        if (profile) {
            setFormData(prevData => ({
                ...prevData,
                customer_id: profile.userId || '', // ตั้งค่า customer_id ใหม่
            }));
        }
    }, [profile]);

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-1/2 max-lg:w-[80%] p-4 rounded-lg shadow-lg">
                <h2 className="text-lg text-center font-bold mb-4">ลงทะเบียน</h2>
                <input
                    type="text"
                    name="first_name"
                    placeholder="ชื่อ"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
                <input
                    type="text"
                    name="last_name"
                    placeholder="นามสกุล"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
                <input
                    type="text"
                    name="user_code"
                    placeholder="รหัสนักศึกษา"
                    value={formData.user_code}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
                <input
                    type="text"
                    name="group_st"
                    placeholder="คณะ"
                    value={formData.group_st}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
                <input
                    type="text"
                    name="branch_st"
                    placeholder="สาขา"
                    value={formData.branch_st}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
                <input
                    type="text"
                    name="tpye_st"
                    placeholder="หลักสูตร"
                    value={formData.tpye_st}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
                <input
                    type="text"
                    name="st_tpye"
                    placeholder="ประเภทนักศึกษา "
                    value={formData.st_tpye}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
                <input
                    type="numer"
                    name="levelST"
                    placeholder="นักศึกษาปีที่"
                    value={formData.levelST}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full rounded-md"
                />
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