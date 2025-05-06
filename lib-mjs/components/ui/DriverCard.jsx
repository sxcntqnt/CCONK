'use client';
import Image from 'next/image';
import { aeonik } from '@/utils/constants/fonts';
import { icons } from '@/utils/constants/icons';
const DriverCard = ({ item, selected, setSelected }) => {
    const statusColor = {
        active: 'bg-green-500',
        inactive: 'bg-red-500',
        offline: 'bg-gray-500',
    }[item.status || 'offline'];
    return (<div onClick={setSelected} onKeyDown={(e) => e.key === 'Enter' && setSelected()} className={`flex flex-row items-center justify-between py-5 px-4 mb-4 border rounded-xl relative cursor-pointer transition ${selected === item.id ? 'bg-blue-100 border-blue-500' : 'border-gray-300 hover:bg-gray-100'} ${aeonik.variable}`} role="button" tabIndex={0} aria-pressed={selected === item.id}>
            {/* Status Indicator */}
            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColor}`}/>

            <Image src={item.profileImageUrl || '/images/default-profile.jpg'} alt={`${item.title}'s profile`} width={56} height={56} className="w-14 h-14 rounded-full object-cover"/>

            <div className="flex-1 flex flex-col items-start justify-center mx-3">
                <div className="flex flex-row items-center justify-start mb-1">
                    <span className="text-lg font-aeonik-medium">{item.title}</span>
                    <span className="text-sm font-aeonik-regular text-gray-600 ml-2">ID: {item.id}</span>
                </div>

                <div className="flex flex-row items-center justify-start">
                    <div className="flex flex-row items-center">
                        <Image src={icons.star} alt="Rating Star" width={14} height={14} className="w-3.5 h-3.5"/>
                        <span className="text-sm font-aeonik-regular ml-1">{item.rating || 4.5}</span>
                    </div>

                    <span className="text-sm font-aeonik-regular text-gray-600 mx-2">|</span>

                    <div className="flex flex-row items-center">
                        <Image src={icons.dollar} alt="Price" width={16} height={16} className="w-4 h-4"/>
                        <span className="text-sm font-aeonik-regular ml-1">$20</span>
                    </div>

                    <span className="text-sm font-aeonik-regular text-gray-600 mx-2">|</span>

                    <span className="text-sm font-aeonik-regular text-gray-600">{item.capacity} seats</span>

                    <span className="text-sm font-aeonik-regular text-gray-600 mx-2">|</span>

                    <span className="text-sm font-aeonik-regular text-gray-600">{item.licensePlate}</span>

                    {item.model && (<>
                            <span className="text-sm font-aeonik-regular text-gray-600 mx-2">|</span>
                            <span className="text-sm font-aeonik-regular text-gray-600">{item.model}</span>
                        </>)}
                </div>
            </div>

            <Image src={item.busImageUrl || '/images/default-bus.jpg'} alt={`${item.licensePlate} bus`} width={56} height={56} className="h-14 w-14 object-contain"/>
        </div>);
};
export default DriverCard;
