"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NRCFrame = void 0;
const image_1 = __importDefault(require("next/image"));
const react_1 = __importStar(require("react"));
const clsx_1 = __importDefault(require("clsx"));
const DEFAULT_BLUR_WIDTH = 200;
const DEFAULT_BLUR_QUALITY = 30;
const NRCFrame = ({ image, priority, component, onLoad, loadingComponent, blurQuality, noBlur, decrementCarousel, incrementCarousel, jumpTo, currentIndex = 0, }) => {
    const [blurUri, setBlurUri] = (0, react_1.useState)(undefined);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!image?.src || image.blurDataURL || noBlur) {
            return;
        }
        const controller = new AbortController();
        fetch(image.src + `?w=${image.blurWidth || DEFAULT_BLUR_WIDTH}&q=${blurQuality || DEFAULT_BLUR_QUALITY}`, {
            signal: controller.signal,
        })
            .then((res) => res.arrayBuffer())
            .then((buffer) => {
            const base64 = Buffer.from(buffer).toString('base64');
            setBlurUri(`data:image/jpeg;base64,${base64}`);
        })
            .catch((error) => {
            if (error.name !== 'AbortError')
                console.error(error);
        });
        return () => {
            controller.abort();
        };
    }, [image, blurQuality, noBlur]);
    const imageStyles = {
        height: '100%',
        objectPosition: getObjectPosition(image, image?.imageFocalPoint),
        width: '100%',
    };
    const isFunction = (value) => typeof value === 'function';
    return (<>
            {!!image?.src && (<>
                    {!loaded &&
                (loadingComponent ? (loadingComponent) : (<div className="absolute animate-pulse w-full bg-gray-300 transform h-full" aria-busy="true"/>))}
                    <image_1.default alt={image?.alt} src={image?.src} width={image.width} height={image.height} style={imageStyles} className={(0, clsx_1.default)('absolute inset-0 object-cover transition duration-200', {
                'blur-sm': !loaded,
            })} priority={priority} blurDataURL={noBlur ? undefined : image.blurDataURL || blurUri} placeholder={noBlur || (!image.blurDataURL && !blurUri) ? undefined : 'blur'} onLoad={() => {
                setLoaded(true);
                if (onLoad)
                    onLoad();
            }}/>
                </>)}

            {!!component && (<div className="absolute inset-0 w-full h-full">
                    {isFunction(component)
                ? component({ decrementCarousel, incrementCarousel, jumpTo, currentIndex })
                : component}
                </div>)}
        </>);
};
exports.NRCFrame = NRCFrame;
const getObjectPosition = (image, focal) => {
    return image?.width && image?.height && focal?.x && focal?.y
        ? `${100 * (focal?.x / image?.width)}% ${100 * (focal?.y / image?.height)}%`
        : undefined;
};
