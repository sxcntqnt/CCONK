"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_1 = __importDefault(require("next/image"));
const icons_1 = require("@/utils/constants/icons");
const ChatPage = () => {
    return (<div className="flex-1 bg-white p-5 min-h-screen">
      <div className="flex-grow">
        <h1 className="text-2xl font-JakartaBold">Chat</h1>
        <div className="flex-1 flex justify-center items-center h-full">
          <image_1.default src={icons_1.images.message} alt="No messages illustration" width={400} height={160} className="w-full h-40 object-contain"/>
          <h2 className="text-3xl font-JakartaBold mt-3">No Messages Yet</h2>
          <p className="text-base mt-2 text-center px-7">
            Start a conversation with your friends and family
          </p>
        </div>
      </div>
    </div>);
};
exports.default = ChatPage;
