"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const navigation_1 = require("next/navigation");
const nextjs_1 = require("@clerk/nextjs");
const icons_1 = require("@/utils/constants/icons");
const TabIcon = ({ source, focused, alt }) => (<div className={`flex justify-center items-center rounded-full ${focused ? "bg-gray-300" : ""} p-2`}>
    <div className={`rounded-full w-12 h-12 flex items-center justify-center ${focused ? "bg-gray-400" : ""}`}>
      <image_1.default src={source} alt={alt} width={28} height={28} className="object-contain"/>
    </div>
  </div>);
const Layout = ({ children }) => {
    const pathname = (0, navigation_1.usePathname)();
    const tabs = [
        { name: "home", title: "Home", icon: icons_1.icons.home },
        { name: "rides", title: "Rides", icon: icons_1.icons.list },
        { name: "chat", title: "Chat", icon: icons_1.icons.chat },
        { name: "profile", title: "Profile", icon: icons_1.icons.profile },
        { name: "drivers", title: "Drivers", icon: icons_1.icons.person },
    ];
    return (<nextjs_1.ClerkProvider>
      <html lang="en">
        <body className="bg-gray-100">
          <main>{children}</main>
          <nav className="fixed bottom-5 left-0 right-0 mx-5 bg-gray-800 rounded-full h-20 flex justify-between items-center px-6 shadow-lg">
            {tabs.map((tab) => {
            const isFocused = pathname === `/${tab.name}` || (tab.name === "home" && pathname === "/");
            return (<link_1.default key={tab.name} href={`/${tab.name}`} className="flex-1 flex justify-center">
                  <TabIcon source={tab.icon} focused={isFocused} alt={`${tab.title} icon`}/>
                </link_1.default>);
        })}
          </nav>
        </body>
      </html>
    </nextjs_1.ClerkProvider>);
};
exports.default = Layout;
