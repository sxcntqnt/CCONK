import Image, { StaticImageData } from 'next/image';
import React, { useEffect, useState } from 'react';
import {
    FocalPoint,
    FrameRenderedComponentProps,
    FrameRenderedComponentPropsWithIndex,
    NRCFrameComponent,
    NRCImage,
} from '@/utils/constants/types';
import clsx from 'clsx';

const DEFAULT_BLUR_WIDTH = 200;
const DEFAULT_BLUR_QUALITY = 30;

export const NRCFrame = ({
    image,
    priority,
    component,
    onLoad,
    loadingComponent,
    blurQuality,
    noBlur,
    decrementCarousel,
    incrementCarousel,
    jumpTo,
    currentIndex = 0,
}: NRCFrameComponent & {
    priority?: boolean;
    onLoad?: () => void;
    incrementCarousel: () => void;
    decrementCarousel: () => void;
    jumpTo: (i: number) => void;
    currentIndex?: number;
    loadingComponent?: React.ReactNode;
    blurQuality?: number;
    noBlur?: boolean;
}) => {
    const [blurUri, setBlurUri] = useState<undefined | string>(undefined);
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
                if (error.name !== 'AbortError') console.error(error);
            });

        return () => {
            controller.abort();
        };
    }, [image, blurQuality, noBlur]);

    const imageStyles: React.CSSProperties = {
        height: '100%',
        objectPosition: getObjectPosition(image, image?.imageFocalPoint),
        width: '100%',
    };

    const isFunction = (value: unknown): value is (props: FrameRenderedComponentPropsWithIndex) => React.ReactNode =>
        typeof value === 'function';

    return (
        <>
            {!!image?.src && (
                <>
                    {!loaded &&
                        (loadingComponent ? (
                            loadingComponent
                        ) : (
                            <div
                                className="absolute animate-pulse w-full bg-gray-300 transform h-full"
                                aria-busy="true"
                            />
                        ))}
                    <Image
                        alt={image?.alt as string}
                        src={image?.src}
                        width={image.width}
                        height={image.height}
                        style={imageStyles}
                        className={clsx('absolute inset-0 object-cover transition duration-200', {
                            'blur-sm': !loaded,
                        })}
                        priority={priority}
                        blurDataURL={noBlur ? undefined : image.blurDataURL || blurUri}
                        placeholder={noBlur || (!image.blurDataURL && !blurUri) ? undefined : 'blur'}
                        onLoad={() => {
                            setLoaded(true);
                            if (onLoad) onLoad();
                        }}
                    />
                </>
            )}

            {!!component && (
                <div className="absolute inset-0 w-full h-full">
                    {isFunction(component)
                        ? (component({ decrementCarousel, incrementCarousel, jumpTo, currentIndex }) as React.ReactNode)
                        : component}
                </div>
            )}
        </>
    );
};

const getObjectPosition = (image?: Partial<StaticImageData> & NRCImage, focal?: FocalPoint) => {
    return image?.width && image?.height && focal?.x && focal?.y
        ? `${100 * (focal?.x / image?.width)}% ${100 * (focal?.y / image?.height)}%`
        : undefined;
};
