// src/components/NRCCarousel.tsx
'use client';

import React, { RefObject, useEffect, useRef, useState } from 'react';
import { Breakpoint, DesktopMobile, Frame, NRCCarouselProps } from '@/utils/constants/types'; // Update path
import clsx from 'clsx';
import { NRCFrame } from './NRCFrame';
import { useHover } from '@/hooks/useHasHover';
import { useSwipeable } from 'react-swipeable';
import { useHasFocus } from '@/hooks/useHasFocus';
import { useIsVisible } from '@/hooks/useIsVisible';
import { useIsMobile } from '@/hooks/use-mobile';

const DEFAULT_ASPECT_RATIO = [16, 9];
const DEFAULT_DURATION = 6000;

type BreakpointClassesShape = {
    [key in Breakpoint]: DesktopMobile<string>;
};

const breakpointClasses: BreakpointClassesShape = {
    xs: { desktop: 'hidden xs:flex', mobile: 'flex xs:hidden' },
    sm: { desktop: 'hidden sm:flex', mobile: 'flex sm:hidden' },
    md: { desktop: 'hidden md:flex', mobile: 'flex md:hidden' },
    lg: { desktop: 'hidden lg:flex', mobile: 'flex lg:hidden' },
    xl: { desktop: 'hidden xl:flex', mobile: 'flex xl:hidden' },
};

const NRCCarousel = ({
    frames,
    breakpoint = 'lg',
    slideDuration,
    noAutoPlay,
    heights,
    loadingComponent,
    blurQuality,
    noBlur,
    ariaLabel,
    controlsComponent,
    willAutoPlayOutsideViewport,
}: NRCCarouselProps) => {
    const isMobile = useIsMobile();
    const breakpointClass: DesktopMobile<string> = breakpointClasses[breakpoint];
    const [index, setIndex] = useState(1);
    const [firstImageLoaded, setFirstImageLoaded] = useState(false);
    const [playingAnimation, setPlayingAnimation] = useState(false);
    const [disableAnimation, setDisableAnimation] = useState(false);
    const [willResetAnimStateOnAnimEnd, setWillResetAnimStateOnAnimEnd] = useState(false);
    const infiniteFrames = [frames[frames.length - 1], ...frames, frames[0]];
    const lessThanTwoFrames = frames.length < 2;

    const visibleFrames = {
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 5,
    };
    const currentVisibleCount = isMobile ? 1 : visibleFrames[breakpoint];

    const incIndex = () => {
        if (playingAnimation || lessThanTwoFrames) return;
        setPlayingAnimation(true);
        setIndex((i) => i + 1);
    };

    const decIndex = () => {
        if (playingAnimation || lessThanTwoFrames) return;
        setPlayingAnimation(true);
        setIndex((i) => i - 1);
    };

    const jumpTo = (i: number) => {
        if (playingAnimation || lessThanTwoFrames) return;
        if (i < 1) {
            setIndex(1);
        } else if (i >= infiniteFrames.length - 2) {
            setIndex(infiniteFrames.length - 2);
        } else {
            setIndex(i + 1);
        }
    };

    const firstFrame = frames[0];
    const desktopAspectRatio =
        (firstFrame.desktop?.image?.width || DEFAULT_ASPECT_RATIO[0]) /
        (firstFrame.desktop?.image?.height || DEFAULT_ASPECT_RATIO[1]);
    const mobileAspectRatio =
        (firstFrame.mobile?.image?.width || DEFAULT_ASPECT_RATIO[1]) /
        (firstFrame.mobile?.image?.height || DEFAULT_ASPECT_RATIO[0]);

    const containerRef = useRef<HTMLDivElement>(null);
    const isHovering = useHover(containerRef as RefObject<HTMLDivElement>);
    const hasFocus = useHasFocus(containerRef as RefObject<HTMLDivElement>);
    const userIsEngaging = isHovering || hasFocus;
    const carouselIsInViewport = useIsVisible(containerRef as RefObject<HTMLDivElement>) || willAutoPlayOutsideViewport;
    const firstImageLoadedOrNoImages = firstImageLoaded || frames.every((frame) => !frame.mobile?.image);

    const toggleFirstImageLoaded = () => {
        if (!firstImageLoaded) setFirstImageLoaded(true);
    };

    const handlers = useSwipeable({
        onSwipedLeft: incIndex,
        onSwipedRight: decIndex,
        swipeDuration: 500,
        preventScrollOnSwipe: true,
        trackMouse: true,
    });

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight') incIndex();
        if (e.key === 'ArrowLeft') decIndex();
    };

    useEffect(() => {
        if (noAutoPlay || lessThanTwoFrames || !carouselIsInViewport) return;
        const interval = setInterval(() => {
            if (!userIsEngaging && firstImageLoadedOrNoImages) incIndex();
        }, slideDuration || DEFAULT_DURATION);
        return () => clearInterval(interval);
    }, [noAutoPlay, slideDuration, isHovering, hasFocus, firstImageLoaded, frames, carouselIsInViewport]);

    useEffect(() => {
        if (index === infiniteFrames.length - 1 || index === 0) {
            setWillResetAnimStateOnAnimEnd(true);
        }
    }, [index]);

    useEffect(() => {
        let timeout: undefined | NodeJS.Timeout;
        if (playingAnimation) {
            timeout = setTimeout(() => setPlayingAnimation(false), 500);
        }
        if (!playingAnimation && willResetAnimStateOnAnimEnd) {
            setIndex(index === infiniteFrames.length - 1 ? 1 : infiniteFrames.length - 2);
            setDisableAnimation(true);
            setWillResetAnimStateOnAnimEnd(false);
            requestAnimationFrame(() => setDisableAnimation(false));
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [playingAnimation]);

    return (
        <section
            className="overflow-hidden w-full relative"
            ref={containerRef}
            onDragStart={(e) => e.preventDefault()}
            role="region"
            aria-label={ariaLabel || 'Promotional carousel'}
        >
            <div
                className={clsx(
                    { 'motion-safe:transition-transform motion-safe:duration-500': !disableAnimation },
                    breakpointClass.mobile,
                    'flex gap-4 p-2',
                )}
                style={{ transform: `translateX(-${(index * 100) / currentVisibleCount}%)` }}
                onKeyDown={onKeyDown}
                {...handlers}
            >
                {infiniteFrames.map((frame, i) => (
                    <div
                        key={deriveFrameKey({
                            frame,
                            isFirstElement: i === 0,
                            isLastElement: i === infiniteFrames.length - 1,
                            isMobile: true,
                        })}
                        className="relative flex-shrink-0"
                        style={{
                            width: `calc(100% / ${currentVisibleCount})`,
                            aspectRatio: !heights?.mobile ? mobileAspectRatio : undefined,
                            height: heights?.mobile,
                        }}
                        aria-hidden={i < index || i >= index + currentVisibleCount}
                        inert={i < index || i >= index + currentVisibleCount ? true : undefined}
                    >
                        <NRCFrame
                            priority={i === 0}
                            component={frame.mobile?.component}
                            image={frame.mobile?.image}
                            onLoad={i === 0 ? toggleFirstImageLoaded : undefined}
                            incrementCarousel={incIndex}
                            decrementCarousel={decIndex}
                            jumpTo={jumpTo}
                            loadingComponent={loadingComponent}
                            blurQuality={blurQuality}
                            noBlur={noBlur}
                        />
                    </div>
                ))}
            </div>
            {!!breakpoint && (
                <div
                    className={clsx(
                        { 'motion-safe:transition-transform motion-safe:duration-500': !disableAnimation },
                        breakpointClass.desktop,
                        'flex gap-4 p-2',
                    )}
                    style={{ transform: `translateX(-${(index * 100) / currentVisibleCount}%)` }}
                    onKeyDown={onKeyDown}
                    {...handlers}
                >
                    {infiniteFrames.map((frame, i) => (
                        <div
                            key={deriveFrameKey({
                                frame,
                                isFirstElement: i === 0,
                                isLastElement: i === infiniteFrames.length - 1,
                            })}
                            className="relative flex-shrink-0"
                            style={{
                                width: `calc(100% / ${currentVisibleCount})`,
                                aspectRatio: !heights?.desktop ? desktopAspectRatio : undefined,
                                height: heights?.desktop,
                            }}
                            aria-hidden={i < index || i >= index + currentVisibleCount}
                            inert={i < index || i >= index + currentVisibleCount ? true : undefined}
                        >
                            <NRCFrame
                                priority={i === 0}
                                component={frame.desktop?.component}
                                image={frame.desktop?.image}
                                onLoad={i === 0 ? toggleFirstImageLoaded : undefined}
                                incrementCarousel={incIndex}
                                decrementCarousel={decIndex}
                                jumpTo={jumpTo}
                                loadingComponent={loadingComponent}
                                blurQuality={blurQuality}
                                noBlur={noBlur}
                            />
                        </div>
                    ))}
                </div>
            )}
            {!!controlsComponent &&
                controlsComponent({
                    decrementCarousel: decIndex,
                    incrementCarousel: incIndex,
                    jumpTo,
                    currentIndex: index - 1,
                })}
        </section>
    );
};

type DeriveFrameKeyParams = {
    frame: Frame;
    isFirstElement?: boolean;
    isLastElement?: boolean;
    isMobile?: boolean;
};

const deriveFrameKey = ({ frame, isFirstElement, isLastElement, isMobile }: DeriveFrameKeyParams) => {
    let key = frame.key || (isMobile ? frame.mobile?.image?.src : frame.desktop?.image?.src);
    if (isFirstElement) key = key + '-clone-1';
    if (isLastElement) key = key + '-clone-2';
    return key;
};

export default NRCCarousel;
export type { Frame, FrameRenderedComponentPropsWithIndex } from '@/utils/constants/types';
