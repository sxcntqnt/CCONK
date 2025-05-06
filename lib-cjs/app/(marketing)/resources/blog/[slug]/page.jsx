"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const blogs_json_1 = __importDefault(require("@/utils/constants/blogs.json"));
const BlogPage = ({ params }) => {
    const blog = blogs_json_1.default.find((blog) => blog.slug === params.slug);
    return (<div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 pb-80 md:px-0">
            <div className="flex flex-col items-center justify-center">
                <h1 className="mt-6 text-center font-heading text-2xl font-semibold !leading-tight md:text-4xl lg:text-5xl">
                    {blog?.title}
                </h1>
                <p className="mt-6 text-center text-base text-muted-foreground md:text-lg">{blog?.description}</p>
            </div>
        </div>);
};
exports.default = BlogPage;
