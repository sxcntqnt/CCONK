'use client';

import React, { RefObject, useEffect, useRef, useState, useCallback } from 'react';
import { Breakpoint, DesktopMobile, Frame, NRCCarouselProps } from '@/utils/constants/types';
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
    sm: { desktop: 'hidden sm:flex', mobile: 'flex sm:hidden' },
    md: { desktop: 'hidden md:flex', mobile: 'flex md:hidden' },
    lg: { desktop: 'hidden lg:flex', mobile: 'flex lg:hidden' },
    xl: { desktop: 'hidden xl:flex', mobile: 'flex xl:hidden' },
    '2xl': { desktop: 'hidden 2xl:flex', mobile: 'flex 2xl:hidden' },
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
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    const infiniteFrames = [frames[frames.length - 1], ...frames, frames[0]];
    const lessThanTwoFrames = frames.length < 2;

    // Adjusted visible frames for Netflix-style layout
    const visibleFrames = {
        sm: 1,
        md: 2,
        lg: 3,
        xl: 3,
        '2xl': 4,
    };
    const currentVisibleCount = isMobile ? 1 : visibleFrames[breakpoint];

    const containerRef = useRef<HTMLDivElement>(null);
    const isHovering = useHover(containerRef as RefObject<HTMLDivElement>);
    const hasFocus = useHasFocus(containerRef as RefObject<HTMLDivElement>);
    const userIsEngaging = isHovering || hasFocus;
    const carouselIsInViewport = useIsVisible(containerRef as RefObject<HTMLDivElement>) || willAutoPlayOutsideViewport;
    const firstImageLoadedOrNoImages = firstImageLoaded || frames.every((frame) => !frame.mobile?.image);

    const incIndex = useCallback(() => {
        if (playingAnimation || lessThanTwoFrames) return;
        setPlayingAnimation(true);
        setIndex((i) => i + 1);
    }, [playingAnimation, lessThanTwoFrames]);

    const decIndex = useCallback(() => {
        if (playingAnimation || lessThanTwoFrames) return;
        setPlayingAnimation(true);
        setIndex((i) => i - 1);
    }, [playingAnimation, lessThanTwoFrames]);

    const jumpTo = useCallback(
        (i: number) => {
            if (playingAnimation || lessThanTwoFrames) return;
            if (i < 0) {
                setIndex(1);
            } else if (i >= frames.length) {
                setIndex(infiniteFrames.length - 2);
            } else {
                setIndex(i + 1);
            }
        },
        [playingAnimation, lessThanTwoFrames, frames.length, infiniteFrames.length],
    );

    const toggleFirstImageLoaded = useCallback(() => {
        if (!firstImageLoaded) setFirstImageLoaded(true);
    }, [firstImageLoaded]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!containerRef.current || !containerRef.current.contains(document.activeElement)) return;
            if (event.key === 'ArrowRight') incIndex();
            if (event.key === 'ArrowLeft') decIndex();
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                jumpTo(index - 1);
            }
        },
        [incIndex, decIndex, jumpTo, index],
    );

    // Window resize handling
    const handleResize = useCallback(() => {
        setWindowWidth(window.innerWidth);
        if (containerRef.current) {
            const scale = window.innerWidth < 640 ? 0.95 : 1; // Smaller scale on iPhone
            containerRef.current.style.transform = `scale(${scale})`;
        }
    }, []);

    // Scroll-based visibility
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const isVisible = rect.top >= -100 && rect.bottom <= window.innerHeight + 100;
        containerRef.current.style.opacity = isVisible ? '1' : '0.9';
    }, []);

    // Add and clean up event listeners
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);

        handleResize();
        handleScroll();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleKeyDown, handleResize, handleScroll]);

    // Auto-play interval
    useEffect(() => {
        if (noAutoPlay || lessThanTwoFrames || !carouselIsInViewport) return;
        const interval = setInterval(() => {
            if (!userIsEngaging && firstImageLoadedOrNoImages) incIndex();
        }, slideDuration || DEFAULT_DURATION);
        return () => clearInterval(interval);
    }, [noAutoPlay, slideDuration, userIsEngaging, firstImageLoadedOrNoImages, carouselIsInViewport, incIndex]);

    // Animation state management
    useEffect(() => {
        if (index === infiniteFrames.length - 1 || index === 0) {
            setWillResetAnimStateOnAnimEnd(true);
        }
    }, [index, infiniteFrames.length]);

    useEffect(() => {
        let timeout: NodeJS.Timeout | undefined;
        if (playingAnimation) {
            timeout = setTimeout(() => setPlayingAnimation(false), 600); // Match transition duration
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
    }, [playingAnimation, willResetAnimStateOnAnimEnd, index, infiniteFrames.length]);

    const firstFrame = frames[0];
    const desktopAspectRatio =
        (firstFrame.desktop?.image?.width || DEFAULT_ASPECT_RATIO[0]) /
        (firstFrame.desktop?.image?.height || DEFAULT_ASPECT_RATIO[1]);
    const mobileAspectRatio =
        (firstFrame.mobile?.image?.width || DEFAULT_ASPECT_RATIO[0]) /
        (firstFrame.mobile?.image?.height || DEFAULT_ASPECT_RATIO[1]);

    // Swipe handlers with momentum
    const swipeHandlers = useSwipeable({
        onSwipedLeft: incIndex,
        onSwipedRight: decIndex,
        swipeDuration: 600,
        preventScrollOnSwipe: true,
        trackMouse: true,
        delta: 10, // Minimum swipe distance
        trackTouch: true,
    });

    return (
        <section
            className="relative w-full overflow-hidden bg-gray-900 py-4"
            ref={containerRef}
            onDragStart={(e) => e.preventDefault()}
            role="region"
            aria-label={ariaLabel || 'Promotional carousel'}
            tabIndex={0}
        >
            {/* Carousel Container */}
            <div
                className={clsx(
                    breakpointClass.mobile,
                    'flex gap-2 px-2 transition-transform duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]',
                    { 'motion-safe:transition-none': disableAnimation },
                )}
                style={{ transform: `translateX(-${(index * 100) / currentVisibleCount}%)` }}
                {...swipeHandlers}
            >
                {infiniteFrames.map((frame, i) => (
                    <div
                        key={deriveFrameKey({
                            frame,
                            isFirstElement: i === 0,
                            isLastElement: i === infiniteFrames.length - 1,
                            isMobile: true,
                        })}
                        className={clsx(
                            'relative flex-shrink-0 rounded-lg overflow-hidden shadow-lg transition-transform duration-300',
                            {
                                'scale-105 z-10': i === index, // Scale up active frame
                                'scale-95 opacity-80': i !== index, // Scale down inactive frames
                            },
                        )}
                        style={{
                            width: `calc(90% / ${currentVisibleCount})`, // Slightly smaller for gap
                            aspectRatio: !heights?.mobile ? mobileAspectRatio : undefined,
                            height: heights?.mobile || 'auto',
                        }}
                        aria-hidden={i < index || i >= index + currentVisibleCount}
                        aria-current={i === index ? 'true' : undefined}
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
                            currentIndex={index - 1}
                        />
                    </div>
                ))}
            </div>

            {/* Desktop Carousel */}
            {!!breakpoint && (
                <div
                    className={clsx(
                        breakpointClass.desktop,
                        'flex gap-4 px-4 transition-transform duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]',
                        { 'motion-safe:transition-none': disableAnimation },
                    )}
                    style={{ transform: `translateX(-${(index * 100) / currentVisibleCount}%)` }}
                    {...swipeHandlers}
                >
                    {infiniteFrames.map((frame, i) => (
                        <div
                            key={deriveFrameKey({
                                frame,
                                isFirstElement: i === 0,
                                isLastElement: i === infiniteFrames.length - 1,
                            })}
                            className={clsx(
                                'relative flex-shrink-0 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105',
                                {
                                    'scale-105 z-10': i === index, // Scale up active frame
                                    'scale-95 opacity-80': i !== index, // Scale down inactive frames
                                },
                            )}
                            style={{
                                width: `calc(90% / ${currentVisibleCount})`,
                                aspectRatio: !heights?.desktop ? desktopAspectRatio : undefined,
                                height: heights?.desktop || 'auto',
                            }}
                            aria-hidden={i < index || i >= index + currentVisibleCount}
                            aria-current={i === index ? 'true' : undefined}
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
                                currentIndex={index - 1}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Netflix-Style Controls */}
            <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4 pointer-events-none">
                <button
                    className={clsx(
                        'pointer-events-auto bg-gray-800 bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-75 transition-opacity',
                        { 'opacity-0': index <= 1 && !isHovering, 'opacity-100': index > 1 || isHovering },
                    )}
                    onClick={decIndex}
                    aria-label="Previous slide"
                    disabled={playingAnimation || lessThanTwoFrames}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    className={clsx(
                        'pointer-events-auto bg-gray-800 bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-75 transition-opacity',
                        {
                            'opacity-0': index >= infiniteFrames.length - 2 && !isHovering,
                            'opacity-100': index < infiniteFrames.length - 2 || isHovering,
                        },
                    )}
                    onClick={incIndex}
                    aria-label="Next slide"
                    disabled={playingAnimation || lessThanTwoFrames}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Dot Indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                {frames.map((_, i) => (
                    <button
                        key={i}
                        className={clsx(
                            'w-2 h-2 rounded-full transition-all duration-300',
                            i === index - 1 ? 'bg-white scale-125' : 'bg-gray-500',
                        )}
                        onClick={() => jumpTo(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === index - 1 ? 'true' : undefined}
                    />
                ))}
            </div>

            {/* Custom Controls */}
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
