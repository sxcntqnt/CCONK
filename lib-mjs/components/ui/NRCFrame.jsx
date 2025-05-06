import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
const DEFAULT_BLUR_WIDTH = 200;
const DEFAULT_BLUR_QUALITY = 30;
export const NRCFrame = ({ image, priority, component, onLoad, loadingComponent, blurQuality, noBlur, decrementCarousel, incrementCarousel, jumpTo, currentIndex = 0, }) => {
    const [blurUri, setBlurUri] = useState(undefined);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
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
                    <Image alt={image?.alt} src={image?.src} width={image.width} height={image.height} style={imageStyles} className={clsx('absolute inset-0 object-cover transition duration-200', {
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
const getObjectPosition = (image, focal) => {
    return image?.width && image?.height && focal?.x && focal?.y
        ? `${100 * (focal?.x / image?.width)}% ${100 * (focal?.y / image?.height)}%`
        : undefined;
};
