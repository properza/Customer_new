// src/features/common/Customer.js
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactPaginate from 'react-paginate';
import Top from './Top';
import TitleCard from '../../components/Cards/TitleCard';
import { loginWithLine, resetState, updateinfo, gethistory, upFaceurl, signin, getrewarddata, gethistoryreward, redeemReward } from '../common/userSlice';
import classNames from 'classnames';
import Modal from './Modal/Modal';
import ModalUpdateInfo from './Modal/ModalUpdateInfo';
import ModalDetail from './Modal/ModalDetail';
import ModalFaceUpload from './Modal/ModalFaceUpload';
import ModalFaceScan from './Modal/ModalFaceScan';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';
import { loadModels } from './Modal/utils/faceApi';

export default function Customer() {
    const dispatch = useDispatch();
    const location = useLocation();
    const [activebtn, setactivebtn] = useState('history');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ModalRegister, setModalRegister] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const historyData = useSelector(state => state.user.gethistorysData);
    const historyreward = useSelector(state => state.user.gethistoryrewards);
    const getreward = useSelector(state => state.user.getrewardslist);
    const [isModalDetailOpen, setIsModalDetailOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isFaceUploadModalOpen, setIsFaceUploadModalOpen] = useState(false);
    const [referral, setReferral] = useState(null);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    const [isFaceScanModalOpen, setIsFaceScanModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);

    // Select necessary state from Redux store
    const { profile, customerinfo, isLoading, error } = useSelector((state) => state.user);

    useEffect(() => {
        loadModels().then(() => console.log("Models loaded"));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const referralCode = params.get('referral'); // ดึงค่า referral
        if (referralCode) {
            setReferral(referralCode);
        }
    }, [location.search]);

    useEffect(() => {
        dispatch(loginWithLine());
        return () => dispatch(resetState());
    }, [dispatch]);

    useEffect(() => {
        if (profile) {
            dispatch(gethistory({ page: currentPage, userID: profile.userId }));
            dispatch(getrewarddata({ page: currentPage, userID: profile.userId }));
            dispatch(gethistoryreward({ page: currentPage, userID: profile.userId }));
        }
    }, [dispatch, profile, currentPage]);

    console.log(historyData);
    console.log(getreward);

    useEffect(() => {
        if (customerinfo) {
            const hasRequiredFields = customerinfo.first_name && customerinfo.last_name && customerinfo.user_code && customerinfo.group_st && customerinfo.branch_st && customerinfo.tpye_st;
            if (!hasRequiredFields) {
                setModalRegister(true);
            } else if (!customerinfo.faceUrl) {
                setIsFaceUploadModalOpen(true);
            }

            // ลำดับการเปิดโมดัลตามที่ต้องการ
            if (referral && customerinfo) {
                setIsFaceScanModalOpen(true);
            }
        } else {
            setIsModalOpen(true);
        }
    }, [customerinfo, referral]);

    // เพิ่ม useEffect เพื่อปิดโมดัลเมื่อมี customerinfo
    useEffect(() => {
        if (customerinfo) {
            setIsModalOpen(false);
        }
    }, [customerinfo]);

    const handleRedeemClick = (reward) => {
        // แสดงยืนยันการแลกรางวัลก่อน
        Swal.fire({
            title: 'คุณต้องการแลกของรางวัลนี้หรือไม่?',
            text: `รางวัล: ${reward.reward_name} ต้องใช้แต้ม ${reward.points_required} แต้ม`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก',
        }).then((result) => {
            if (result.isConfirmed) {
                // ถ้าผู้ใช้กด "ตกลง" จะทำการส่งข้อมูล
                const formData = {
                    customerId: profile.userId,  // profile.userId ต้องมีข้อมูล
                    rewardId: reward.id,
                };
    
                dispatch(redeemReward({ formData }))
                    .unwrap()
                    .then((response) => {
                        Swal.fire({
                            icon: 'success',
                            title: 'แลกรางวัลสำเร็จ',
                            text: 'คุณได้แลกรางวัลสำเร็จแล้ว',
                            timer: 1500,
                            showConfirmButton: false,
                            toast: true,
                            position: 'top-end',
                            timerProgressBar: true,
                        });
                        dispatch(getrewarddata({ page: currentPage, userID: profile.userId }));
                        dispatch(gethistoryreward({ page: currentPage, userID: profile.userId }));
                    })
                    .catch((error) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'เกิดข้อผิดพลาดในการแลกรางวัล',
                            text: error.message || 'กรุณาลองใหม่',
                            timer: 1500,
                            showConfirmButton: false,
                            toast: true,
                            position: 'top-end',
                            timerProgressBar: true,
                        });
                    });
            }
        });
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setSelectedImages((prev) => [...prev, ...newImages]);
    };

    const handleRemoveImage = (index) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePreviewImage = (imageUrl) => {
        Swal.fire({
            imageUrl,
            imageWidth: 400,
            imageAlt: "Preview Image",
            showConfirmButton: false,
            showCloseButton: true,
        });
    };

    const handleAcceptReferral = async () => {
        if (!selectedImages || selectedImages.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "กรุณาเลือกไฟล์ก่อน",
                timer: 1500,
                showConfirmButton: false,
            });
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append("customerId", profile.userId);

        let hasValidFile = false; // ตรวจสอบว่ามีไฟล์ที่ถูกต้องหรือไม่
        selectedImages.forEach((img, index) => {
            if (img.file instanceof File) {
                formData.append("images", img.file);
                hasValidFile = true;
            } else {
                console.warn(`⚠️ รูปที่ ${index + 1} ไม่มีไฟล์ที่ถูกต้อง`, img);
            }
        });

        try {
            const res = await dispatch(signin({ eventid: referral, formData })).unwrap();
            
            Swal.fire({
                icon: 'success',
                title: 'ลงทะเบียนสำเร็จ',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timerProgressBar: true
            }).then(() => {
                setIsFaceUploadModalOpen(false);
                dispatch(loginWithLine());
                setReferral(null);
            });
        } catch (error) {
            console.error("Error uploading face image: ", error);
            Swal.fire({
                icon: 'error',
                title: 'ลงทะเบียนไม่สำเร็จ',
                text: error.message,
                timer: 5000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timerProgressBar: true
            }).then(() => {
                setIsFaceUploadModalOpen(false);
                setIsReferralModalOpen(false);
            });
        } finally {
            setIsUploading(false);
            setReferral(null);
        }
    };

    const handleDeclineReferral = () => {
        setIsReferralModalOpen(false);
        setReferral(null); // รีเซ็ต referralCode
    };

    const handleActivityClick = (activity) => {
        setSelectedActivity(activity);
        setIsModalDetailOpen(true);
    };

    // บางส่วนใน Customer.js หรือ Modal
    const handleFaceImageUpload = (formData) => {
        // ต้อง dispatch เป็น { fileData: formData } ให้ตรงกับ upFaceurl
        dispatch(upFaceurl({ fileData: formData }))
            .unwrap()
            .then((res) => {
                console.log("Upload success:", res);
                Swal.fire({
                    icon: 'success',
                    title: 'อัปโหลดรูปหน้าเรียบร้อย',
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                    timerProgressBar: true
                });
                setIsFaceUploadModalOpen(false);
                window.location.reload();

                // หลังจากอัปโหลดสำเร็จ ถ้ามี referralCode ให้เปิด face scan
                if (referral) {
                    setIsFaceScanModalOpen(true);
                }
            })
            .catch((err) => {
                console.error("Upload error:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'อัปโหลดไม่สำเร็จ',
                    text: err?.message || 'กรุณาลองอีกครั้ง',
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                    timerProgressBar: true
                });
            });
    };

    const handlePageChange = ({ selected }) => {
        setCurrentPage(selected + 1);
    };

    //เข้าร่วมกิจกรรม

    const handleModalSubmit = (formData) => {
        dispatch(updateinfo(formData))
            .unwrap()
            .then((res) => {
                Swal.fire({
                    icon: 'success',
                    title: 'ลงทะเบียนสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                    timerProgressBar: true
                });
                setModalRegister(false);
                dispatch(loginWithLine());
                dispatch(resetState());
            })
            .catch((error) => {
                console.error("Error creating event: ", error);
                Swal.fire({
                    icon: 'error',
                    title: 'ลงทะเบียนไม่สำเร็จ',
                    text: 'กรุณากรอกข้อมูลให้ครบ',
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                    timerProgressBar: true
                });
                setModalRegister(true);
            });
    };

    const handleFaceScanSuccess = () => {
        setIsFaceScanModalOpen(false);
        setIsReferralModalOpen(true);

    };

    const handleFaceResetUpload = () => {
        setIsFaceUploadModalOpen(true);
    };

    // Handle errors or loading states as needed
    useEffect(() => {
        if (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'ข้อผิดพลาด',
                text: error,
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timerProgressBar: true
            });
        }
    }, [error]);

    const icons = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="green" className="bi bi-coin" viewBox="0 0 16 16">
            <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518z" />
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11m0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12" />
        </svg>
    );

    const fullname = customerinfo?.first_name && customerinfo?.last_name ? `${customerinfo?.first_name} ${customerinfo?.last_name}` : '-';
    const iconView = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.3333 15.5L9.08333 10.25C8.66667 10.5833 8.1875 10.8472 7.64583 11.0417C7.10417 11.2361 6.52778 11.3333 5.91667 11.3333C4.40278 11.3333 3.12153 10.809 2.07292 9.76042C1.02431 8.71181 0.5 7.43056 0.5 5.91667C0.5 4.40278 1.02431 3.12153 2.07292 2.07292C3.12153 1.02431 4.40278 0.5 5.91667 0.5C7.43056 0.5 8.71181 1.02431 9.76042 2.07292C10.809 3.12153 11.3333 4.40278 11.3333 5.91667C11.3333 6.52778 11.2361 7.10417 11.0417 7.64583C10.8472 8.1875 10.5833 8.66667 10.25 9.08333L15.5 14.3333L14.3333 15.5ZM5.91667 9.66667C6.95833 9.66667 7.84375 9.30208 8.57292 8.57292C9.30208 7.84375 9.66667 6.95833 9.66667 5.91667C9.66667 4.875 9.30208 3.98958 8.57292 3.26042C7.84375 2.53125 6.95833 2.16667 5.91667 2.16667C4.875 2.16667 3.98958 2.53125 3.26042 3.26042C2.53125 3.98958 2.16667 4.875 2.16667 5.91667C2.16667 6.95833 2.53125 7.84375 3.26042 8.57292C3.98958 9.30208 4.875 9.66667 5.91667 9.66667Z" fill="#1D1B20" />
    </svg>;

    const iconFix =
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>;

    return (
        <>
            <Top />
            <div className="flex justify-between p-2 rounded-lg w-[70%] mx-auto max-lg:w-[97%] bg-[#95C0E9]">
                <div className="w-[68%]">
                    <p className='text-white font-bold text-lg'>ข้อมูลส่วนตัว</p>
                    <div className="grid gap-1 bg-white p-2 rounded-lg relative">
                        <div className="flex max-lg:flex-col gap-2 items-center max-lg:items-start">
                            <p>ชื่อ-สกุล :</p>
                            <p id="UserName">{fullname}</p>
                        </div>
                        <div className="flex max-lg:flex-col gap-2 items-center max-lg:items-start">
                            <p>รหัสนักศึกษา :</p>
                            <p id="userSt_id">{customerinfo?.user_code || "-"}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <p>คณะ :</p>
                            <p id="branch">{customerinfo?.group_st || "-"}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <p>สาขา :</p>
                            <p id="sub_branch">{customerinfo?.branch_st || "-"}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <p>ระดับการศึกษา :</p>
                            <p id="levelST">{customerinfo?.tpye_st || "-"}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <p>ชั้นปี :</p>
                            <p id="St-year">{customerinfo?.levelST || "-"}</p>
                        </div>
                        <button className='w-6 h-6 absolute right-1 top-1' onClick={() => setModalRegister(true)}>
                            {iconFix}
                        </button>
                    </div>

                </div>

                <div className="grid items-center">
                    <img
                        className="rounded-full bg-black m-1 mx-auto"
                        width={80}
                        height={80}
                        src={customerinfo?.picture || ""}
                        alt="ProfileUrl"
                    />
                    <div className="grid">
                        <div className="flex gap-2 justify-center items-center mb-2">
                            {icons}
                            <p className='text-white font-medium text-base'>คะแนน : {customerinfo?.total_point || 0}</p>
                        </div>
                        <button className='bg-[#FF9C00] text-white rounded-md px-2 py-1'>กิจกรรมพิเศษ</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-10 max-lg:gap-3 w-[70%] mx-auto max-lg:w-[90%] mt-3">
                <button
                    className={classNames('text-xl font-medium', { 'active': activebtn === 'history' })}
                    onClick={() => setactivebtn('history')}
                >
                    ประวัติกิจกรรม
                </button>
                <button
                    className={classNames('text-xl font-medium', { 'active': activebtn === 'trading' })}
                    onClick={() => setactivebtn('trading')}
                >
                    แลกสิ่งของ
                </button>
                <button
                    className={classNames('text-xl font-medium', { 'active': activebtn === 'historytrading' })}
                    onClick={() => setactivebtn('historytrading')}
                >
                    ประวัติการแลก
                </button>
            </div>

            <div className="w-[70%] mx-auto max-lg:w-[90%]">
                {activebtn === 'history' &&
                    <TitleCard title={'ประวัติกิจกรรม'} title2={`ทั้งหมด ${historyData.meta?.total || 0} รายการ`} topMargin={'mt-1'}>
                        <div className="overflow-auto h-[45vh]">
                            <table className='table w-full border-collapse border border-gray-200'>
                                <thead className='bg-[#F7D4E8]'>
                                    <tr>
                                        <th className="border px-4 py-2">ลำดับ</th>
                                        <th className="border px-4 py-2">กิจกรรม</th>
                                        <th className="border px-4 py-2">ประเภทกิจกรรม</th>
                                        <th className="border px-4 py-2">การเข้าร่วม</th>
                                        <th className="border px-4 py-2">รายละเอียด</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Replace with dynamic data */}
                                    {historyData.data ?
                                        historyData.data?.map((activity, index) => (
                                            <tr key={activity.id}>
                                                <td className="border px-4 py-2">{index + 1}</td>
                                                <td className="border px-4 py-2">{activity.activityName}</td>
                                                <td className="border px-4 py-2">{customerinfo?.st_tpye}</td>
                                                <td className="border px-4 py-2">{activity.created_at ? format(new Date(activity.created_at), "d MMM yyyy hh:mm", { locale: th }) : activity.status}</td>
                                                <td className="border px-4 py-2">
                                                    <button
                                                        className='flex justify-center w-full cursor-pointer'
                                                        onClick={() => handleActivityClick(activity)}
                                                    >
                                                        {iconView}
                                                    </button>
                                                </td>
                                            </tr>
                                        )) :
                                        <tr>
                                            <td colSpan="5" className="text-center py-4">ไม่มีข้อมูล</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                            {historyData.meta?.total >= 10 &&
                                <div className="flex justify-end mt-10">
                                    <ReactPaginate
                                        previousLabel={"<"}
                                        nextLabel={">"}
                                        breakLabel={"..."}
                                        pageCount={historyData.meta?.last_page || 1}
                                        marginPagesDisplayed={2}
                                        pageRangeDisplayed={3}
                                        onPageChange={handlePageChange}
                                        containerClassName={"pagination"}
                                        activeClassName={"active"}
                                        breakClassName={"page-item"}
                                        breakLinkClassName={"page-link"}
                                        pageClassName={"page-item"}
                                        pageLinkClassName={"page-link"}
                                        previousClassName={"page-item"}
                                        previousLinkClassName={"page-link"}
                                        nextClassName={"page-item"}
                                        nextLinkClassName={"page-link"}
                                        disabledClassName={"disabled"}
                                    />
                                </div>
                            }
                        </div>
                    </TitleCard>
                }

                {activebtn === 'trading' &&
                    <TitleCard title={'แลกสิ่งของ'} title2={`ทั้งหมด ${getreward.meta?.total || 0} รายการ`} topMargin={'mt-1'}>
                        <div className="overflow-auto h-[45vh]">
                            {getreward.data && getreward.data.length > 0 ? (<div className='grid grid-cols-2 gap-5'>
                                {getreward.data.map((reward, index) => (
                                    <div key={reward.id} className='flex flex-col justify-between border shadow-lg rounded-md p-2 '>
                                        <img src={reward.rewardUrl} alt="" className='w-35 h-35 mb-2 mx-auto' />

                                        <div className="">
                                            <div className="my-1">
                                                <p>{reward.reward_name}</p>
                                                <p>มีจำนวน : {reward.amount} ชิ้น/อัน</p>
                                                <p>แต้มที่ต้องการ : {reward.points_required || '-'}</p>
                                            </div>

                                            <button
                                                className="bg-blue-500 text-white px-3 py-1 mt-2 rounded-md w-full hover:bg-blue-400"
                                                onClick={() => handleRedeemClick(reward)} // เรียกฟังก์ชัน handleRedeemClick
                                            >
                                                แลก
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>) : (
                                <p className="text-center mt-4">ไม่มีข้อมูลรางวัล</p>
                            )}
                            {getreward.meta?.total >= 10 &&
                                <div className="flex justify-end mt-4">
                                    <ReactPaginate
                                        previousLabel={"<"}
                                        nextLabel={">"}
                                        breakLabel={"..."}
                                        pageCount={getreward.meta?.last_page || 1}
                                        marginPagesDisplayed={2}
                                        pageRangeDisplayed={3}
                                        onPageChange={({ selected }) => dispatch(getrewarddata({ page: selected + 1, userID: profile.userId }))}
                                        containerClassName={"pagination"}
                                        activeClassName={"active"}
                                        breakClassName={"page-item"}
                                        breakLinkClassName={"page-link"}
                                        pageClassName={"page-item"}
                                        pageLinkClassName={"page-link"}
                                        previousClassName={"page-item"}
                                        previousLinkClassName={"page-link"}
                                        nextClassName={"page-item"}
                                        nextLinkClassName={"page-link"}
                                        disabledClassName={"disabled"}
                                    />
                                </div>
                            }
                        </div>
                    </TitleCard>
                }

                {activebtn === 'historytrading' &&
                    <TitleCard title={'ประวัติการแลก'} title2={`ทั้งหมด ${historyreward.meta?.total} รายการ`} topMargin={'mt-1'}>
                        <div className="overflow-auto h-[45vh]">
                            {historyreward.data && historyreward.data.length > 0 ? (<div className='grid grid-cols-2 gap-5'>
                                {historyreward.data.map((reward, index) => (
                                    <div key={reward.id} className='flex justify-between border shadow-lg rounded-md p-2 '>
                                        <div className="">
                                            <div className="my-1">
                                                <p>{reward.reward_name}</p>
                                                <p>{reward.status}</p>
                                            </div>
                                            <button className="bg-blue-500 text-white px-3 py-1 mt-2 rounded-md w-full hover:bg-blue-400">
                                                ใช้รางวัล
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>) : (
                                <p className="text-center mt-4">ไม่มีข้อมูลรางวัล</p>
                            )}
                            {historyreward.meta?.total >= 10 &&
                                <div className="flex justify-end mt-4">
                                    <ReactPaginate
                                        previousLabel={"<"}
                                        nextLabel={">"}
                                        breakLabel={"..."}
                                        pageCount={historyreward.meta?.last_page || 1}
                                        marginPagesDisplayed={2}
                                        pageRangeDisplayed={3}
                                        onPageChange={({ selected }) => dispatch(gethistoryreward({ page: selected + 1, userID: profile.userId }))}
                                        containerClassName={"pagination"}
                                        activeClassName={"active"}
                                        breakClassName={"page-item"}
                                        breakLinkClassName={"page-link"}
                                        pageClassName={"page-item"}
                                        pageLinkClassName={"page-link"}
                                        previousClassName={"page-item"}
                                        previousLinkClassName={"page-link"}
                                        nextClassName={"page-item"}
                                        nextLinkClassName={"page-link"}
                                        disabledClassName={"disabled"}
                                    />
                                </div>
                            }
                        </div>
                    </TitleCard>
                }

                <ModalDetail
                    isOpen={isModalDetailOpen}
                    onClose={() => setIsModalDetailOpen(false)}
                    activity={selectedActivity}
                />

                {/* Referral Modal */}
                <Modal isOpen={isReferralModalOpen} onClose={handleDeclineReferral}>
                    <div className="p-4">
                        <h2 className="text-lg font-bold mb-4">คำเชิญเข้าร่วมกิจกรรม</h2>
                        <p>คุณได้รับคำเชิญให้เข้าร่วมกิจกรรมผ่าน referral: <strong>{referral}</strong></p>

                        {/* Input Upload รูป */}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="mt-4 block w-full text-sm text-gray-700 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                        />

                        {/* แสดงตัวอย่างรูปที่อัปโหลด */}
                        {selectedImages.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {selectedImages.map((img, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={img.preview}
                                            alt="Uploaded"
                                            className="w-full h-24 object-cover rounded cursor-pointer"
                                            onClick={() => handlePreviewImage(img.preview)}
                                        />
                                        <button
                                            className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={handleDeclineReferral}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                            >
                                ปฏิเสธ
                            </button>
                            <button
                                onClick={() => handleAcceptReferral(referral)}
                                className="bg-green-500 text-white px-4 py-2 rounded-md"
                                disabled={isUploading}
                            >
                                {isUploading ? "กำลังลงทะเบียน..." : "ยอมรับ"}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Loading Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                        <p>กำลังโหลด...</p>
                    </div>
                </Modal>

                {/* Face Upload Modal */}
                {!ModalRegister && <>
                    <ModalFaceUpload
                        isOpen={isFaceUploadModalOpen}
                        onClose={() => setIsFaceUploadModalOpen(false)}
                        onSubmit={handleFaceImageUpload}
                        profile={profile}
                    />


                    {/* Face Scan Modal */}
                    {!isFaceUploadModalOpen &&
                        <ModalFaceScan
                            isOpen={isFaceScanModalOpen}
                            onClose={() => setIsFaceScanModalOpen(false)}
                            faceUrl={customerinfo?.faceUrl}
                            onSuccess={handleFaceScanSuccess}
                        />
                    }

                </>}
            </div>

            {/* Registration Modal */}
            <ModalUpdateInfo
                isOpen={ModalRegister}
                onClose={() => setModalRegister(false)}
                onSubmit={handleModalSubmit}
                profile={profile}
            />
        </>
    )
}
