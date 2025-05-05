"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Marquee;
const utils_1 = require("@/utils");
function Marquee({ className, reverse, pauseOnHover = false, children, vertical = false, repeat = 4, ...props }) {
    return (<div {...props} className={(0, utils_1.cn)('group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]', {
            'flex-row': !vertical,
            'flex-col': vertical,
        }, className)}>
            {Array(repeat)
            .fill(0)
            .map((_, i) => (<div key={i} className={(0, utils_1.cn)('flex shrink-0 justify-around [gap:var(--gap)]', {
                'animate-marquee flex-row': !vertical,
                'animate-marquee-vertical flex-col': vertical,
                'group-hover:[animation-play-state:paused]': pauseOnHover,
                '[animation-direction:reverse]': reverse,
            })}>
                        {children}
                    </div>))}
        </div>);
}
