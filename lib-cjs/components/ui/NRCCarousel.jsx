"use strict";
// src/components/NRCCarousel.tsx
'use client';
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
const react_1 = __importStar(require("react"));
const clsx_1 = __importDefault(require("clsx"));
const NRCFrame_1 = require("./NRCFrame");
const useHasHover_1 = require("@/hooks/useHasHover");
const react_swipeable_1 = require("react-swipeable");
const useHasFocus_1 = require("@/hooks/useHasFocus");
const useIsVisible_1 = require("@/hooks/useIsVisible");
const use_mobile_1 = require("@/hooks/use-mobile");
const DEFAULT_ASPECT_RATIO = [16, 9];
const DEFAULT_DURATION = 6000;
const breakpointClasses = {
    xs: { desktop: 'hidden xs:flex', mobile: 'flex xs:hidden' },
    sm: { desktop: 'hidden sm:flex', mobile: 'flex sm:hidden' },
    md: { desktop: 'hidden md:flex', mobile: 'flex md:hidden' },
    lg: { desktop: 'hidden lg:flex', mobile: 'flex lg:hidden' },
    xl: { desktop: 'hidden xl:flex', mobile: 'flex xl:hidden' },
};
const NRCCarousel = ({ frames, breakpoint = 'lg', slideDuration, noAutoPlay, heights, loadingComponent, blurQuality, noBlur, ariaLabel, controlsComponent, willAutoPlayOutsideViewport, }) => {
    const isMobile = (0, use_mobile_1.useIsMobile)();
    const breakpointClass = breakpointClasses[breakpoint];
    const [index, setIndex] = (0, react_1.useState)(1);
    const [firstImageLoaded, setFirstImageLoaded] = (0, react_1.useState)(false);
    const [playingAnimation, setPlayingAnimation] = (0, react_1.useState)(false);
    const [disableAnimation, setDisableAnimation] = (0, react_1.useState)(false);
    const [willResetAnimStateOnAnimEnd, setWillResetAnimStateOnAnimEnd] = (0, react_1.useState)(false);
    const [windowWidth, setWindowWidth] = (0, react_1.useState)(typeof window !== 'undefined' ? window.innerWidth : 0);
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
    const containerRef = (0, react_1.useRef)(null);
    const isHovering = (0, useHasHover_1.useHover)(containerRef);
    const hasFocus = (0, useHasFocus_1.useHasFocus)(containerRef);
    const userIsEngaging = isHovering || hasFocus;
    const carouselIsInViewport = (0, useIsVisible_1.useIsVisible)(containerRef) || willAutoPlayOutsideViewport;
    const firstImageLoadedOrNoImages = firstImageLoaded || frames.every((frame) => !frame.mobile?.image);
    const incIndex = (0, react_1.useCallback)(() => {
        if (playingAnimation || lessThanTwoFrames)
            return;
        setPlayingAnimation(true);
        setIndex((i) => i + 1);
    }, [playingAnimation, lessThanTwoFrames]);
    const decIndex = (0, react_1.useCallback)(() => {
        if (playingAnimation || lessThanTwoFrames)
            return;
        setPlayingAnimation(true);
        setIndex((i) => i - 1);
    }, [playingAnimation, lessThanTwoFrames]);
    const jumpTo = (0, react_1.useCallback)((i) => {
        if (playingAnimation || lessThanTwoFrames)
            return;
        if (i < 1) {
            setIndex(1);
        }
        else if (i >= infiniteFrames.length - 2) {
            setIndex(infiniteFrames.length - 2);
        }
        else {
            setIndex(i + 1);
        }
    }, [playingAnimation, lessThanTwoFrames, infiniteFrames.length]);
    const toggleFirstImageLoaded = (0, react_1.useCallback)(() => {
        if (!firstImageLoaded)
            setFirstImageLoaded(true);
    }, [firstImageLoaded]);
    // Keyboard navigation
    const handleKeyDown = (0, react_1.useCallback)((event) => {
        if (!containerRef.current || !containerRef.current.contains(document.activeElement))
            return;
        if (event.key === 'ArrowRight')
            incIndex();
        if (event.key === 'ArrowLeft')
            decIndex();
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (controlsComponent)
                jumpTo(index - 1); // Trigger control action
        }
    }, [incIndex, decIndex, jumpTo, index, controlsComponent]);
    // Window resize handling
    const handleResize = (0, react_1.useCallback)(() => {
        setWindowWidth(window.innerWidth);
        if (containerRef.current) {
            const scale = window.innerWidth < 768 ? 0.9 : 1;
            containerRef.current.style.transform = `scale(${scale})`;
        }
    }, []);
    // Scroll-based visibility
    const handleScroll = (0, react_1.useCallback)(() => {
        if (!containerRef.current)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        containerRef.current.style.opacity = isVisible ? '1' : '0.8';
    }, []);
    // Add and clean up event listeners
    (0, react_1.useEffect)(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);
        // Initial calls
        handleResize();
        handleScroll();
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleKeyDown, handleResize, handleScroll]);
    // Auto-play interval
    (0, react_1.useEffect)(() => {
        if (noAutoPlay || lessThanTwoFrames || !carouselIsInViewport)
            return;
        const interval = setInterval(() => {
            if (!userIsEngaging && firstImageLoadedOrNoImages)
                incIndex();
        }, slideDuration || DEFAULT_DURATION);
        return () => clearInterval(interval);
    }, [noAutoPlay, slideDuration, userIsEngaging, firstImageLoadedOrNoImages, carouselIsInViewport, incIndex]);
    // Animation state management
    (0, react_1.useEffect)(() => {
        if (index === infiniteFrames.length - 1 || index === 0) {
            setWillResetAnimStateOnAnimEnd(true);
        }
    }, [index, infiniteFrames.length]);
    (0, react_1.useEffect)(() => {
        let timeout;
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
            if (timeout)
                clearTimeout(timeout);
        };
    }, [playingAnimation, willResetAnimStateOnAnimEnd, index, infiniteFrames.length]);
    const firstFrame = frames[0];
    const desktopAspectRatio = (firstFrame.desktop?.image?.width || DEFAULT_ASPECT_RATIO[0]) /
        (firstFrame.desktop?.image?.height || DEFAULT_ASPECT_RATIO[1]);
    const mobileAspectRatio = (firstFrame.mobile?.image?.width || DEFAULT_ASPECT_RATIO[1]) /
        (firstFrame.mobile?.image?.height || DEFAULT_ASPECT_RATIO[0]);
    return (<section className="overflow-hidden w-full relative" ref={containerRef} onDragStart={(e) => e.preventDefault()} role="region" aria-label={ariaLabel || 'Promotional carousel'} tabIndex={0} // Make focusable
    >
            <div className={(0, clsx_1.default)({ 'motion-safe:transition-transform motion-safe:duration-500': !disableAnimation }, breakpointClass.mobile, 'flex gap-4 p-2')} style={{ transform: `translateX(-${(index * 100) / currentVisibleCount}%)` }} {...(0, react_swipeable_1.useSwipeable)({
        onSwipedLeft: incIndex,
        onSwipedRight: decIndex,
        swipeDuration: 500,
        preventScrollOnSwipe: true,
        trackMouse: true,
    })}>
                {infiniteFrames.map((frame, i) => (<div key={deriveFrameKey({
                frame,
                isFirstElement: i === 0,
                isLastElement: i === infiniteFrames.length - 1,
                isMobile: true,
            })} className="relative flex-shrink-0" style={{
                width: `calc(100% / ${currentVisibleCount})`,
                aspectRatio: !heights?.mobile ? mobileAspectRatio : undefined,
                height: heights?.mobile,
            }} aria-hidden={i < index || i >= index + currentVisibleCount} inert={i < index || i >= index + currentVisibleCount ? true : undefined}>
                        <NRCFrame_1.NRCFrame priority={i === 0} component={frame.mobile?.component} image={frame.mobile?.image} onLoad={i === 0 ? toggleFirstImageLoaded : undefined} incrementCarousel={incIndex} decrementCarousel={decIndex} jumpTo={jumpTo} loadingComponent={loadingComponent} blurQuality={blurQuality} noBlur={noBlur} currentIndex={index - 1}/>
                    </div>))}
            </div>
            {!!breakpoint && (<div className={(0, clsx_1.default)({ 'motion-safe:transition-transform motion-safe:duration-500': !disableAnimation }, breakpointClass.desktop, 'flex gap-4 p-2')} style={{ transform: `translateX(-${(index * 100) / currentVisibleCount}%)` }} {...(0, react_swipeable_1.useSwipeable)({
            onSwipedLeft: incIndex,
            onSwipedRight: decIndex,
            swipeDuration: 500,
            preventScrollOnSwipe: true,
            trackMouse: true,
        })}>
                    {infiniteFrames.map((frame, i) => (<div key={deriveFrameKey({
                    frame,
                    isFirstElement: i === 0,
                    isLastElement: i === infiniteFrames.length - 1,
                })} className="relative flex-shrink-0" style={{
                    width: `calc(100% / ${currentVisibleCount})`,
                    aspectRatio: !heights?.desktop ? desktopAspectRatio : undefined,
                    height: heights?.desktop,
                }} aria-hidden={i < index || i >= index + currentVisibleCount} inert={i < index || i >= index + currentVisibleCount ? true : undefined}>
                            <NRCFrame_1.NRCFrame priority={i === 0} component={frame.desktop?.component} image={frame.desktop?.image} onLoad={i === 0 ? toggleFirstImageLoaded : undefined} incrementCarousel={incIndex} decrementCarousel={decIndex} jumpTo={jumpTo} loadingComponent={loadingComponent} blurQuality={blurQuality} noBlur={noBlur} currentIndex={index - 1}/>
                        </div>))}
                </div>)}
            {!!controlsComponent &&
            controlsComponent({
                decrementCarousel: decIndex,
                incrementCarousel: incIndex,
                jumpTo,
                currentIndex: index - 1,
            })}
        </section>);
};
const deriveFrameKey = ({ frame, isFirstElement, isLastElement, isMobile }) => {
    let key = frame.key || (isMobile ? frame.mobile?.image?.src : frame.desktop?.image?.src);
    if (isFirstElement)
        key = key + '-clone-1';
    if (isLastElement)
        key = key + '-clone-2';
    return key;
};
exports.default = NRCCarousel;
