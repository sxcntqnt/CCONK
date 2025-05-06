import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ClerkProvider } from '@clerk/nextjs';
import { icons } from '@/utils/constants/icons';
const TabIcon = ({ source, focused, alt }) => (<div className={`flex justify-center items-center rounded-full ${focused ? 'bg-gray-300' : ''} p-2`}>
        <div className={`rounded-full w-12 h-12 flex items-center justify-center ${focused ? 'bg-gray-400' : ''}`}>
            <Image src={source} alt={alt} width={28} height={28} className="object-contain"/>
        </div>
    </div>);
const Layout = ({ children }) => {
    const pathname = usePathname();
    const tabs = [
        { name: 'home', title: 'Home', icon: icons.home },
        { name: 'rides', title: 'Rides', icon: icons.list },
        { name: 'chat', title: 'Chat', icon: icons.chat },
        { name: 'profile', title: 'Profile', icon: icons.profile },
        { name: 'drivers', title: 'Drivers', icon: icons.person },
    ];
    return (<ClerkProvider>
            <html lang="en">
                <body className="bg-gray-100">
                    <main>{children}</main>
                    <nav className="fixed bottom-5 left-0 right-0 mx-5 bg-gray-800 rounded-full h-20 flex justify-between items-center px-6 shadow-lg">
                        {tabs.map((tab) => {
            const isFocused = pathname === `/${tab.name}` || (tab.name === 'home' && pathname === '/');
            return (<Link key={tab.name} href={`/${tab.name}`} className="flex-1 flex justify-center">
                                    <TabIcon source={tab.icon} focused={isFocused} alt={`${tab.title} icon`}/>
                                </Link>);
        })}
                    </nav>
                </body>
            </html>
        </ClerkProvider>);
};
export default Layout;
