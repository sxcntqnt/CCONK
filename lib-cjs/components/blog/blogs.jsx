"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const card_1 = require("@/components/ui/card");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const magic_card_1 = __importDefault(require("../ui/magic-card"));
const blogs_json_1 = __importDefault(require("@/utils/constants/blogs.json"));
const Blogs = () => {
    return (<div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 md:px-0">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {blogs_json_1.default.map((blog, id) => (<magic_card_1.default key={id} className="relative p-0 md:p-0">
                        <link_1.default href={`/resources/blog/${blog.slug}`} className="-z-1 absolute inset-0 h-full w-full" legacyBehavior></link_1.default>
                        <card_1.Card className="group border-0">
                            <card_1.CardContent className="p-4 lg:p-6">
                                <div className="flex h-40 items-center justify-center overflow-hidden lg:h-52">
                                    <image_1.default src={blog.image} alt={blog.title} width={1024} height={1024} unoptimized className="h-full w-full rounded-lg object-cover"/>
                                </div>
                                <div className="mt-4 flex flex-col items-start justify-start">
                                    <card_1.CardTitle className="text-lg font-semibold text-foreground/80 transition-all duration-300 group-hover:text-foreground">
                                        {blog.title}
                                    </card_1.CardTitle>
                                    <card_1.CardDescription className="mt-2">
                                        {blog.description.length > 100
                ? `${blog.description.substring(0, 100)}...`
                : blog.description}
                                    </card_1.CardDescription>
                                </div>
                            </card_1.CardContent>
                        </card_1.Card>
                    </magic_card_1.default>))}
            </div>
        </div>);
};
exports.default = Blogs;
