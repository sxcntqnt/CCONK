import { AnimationContainer, Blogs, MaxWidthWrapper } from '@/components';
import React from 'react';

const BlogPage = () => {
    return (
        <div className="flex flex-col items-center justify-center pb-20">
            <AnimationContainer delay={0.1} className="w-full">
                <h1 className="mt-6 text-center font-heading text-2xl font-semibold !leading-tight md:text-4xl lg:text-5xl">
                    Blog
                </h1>
                <p className="mt-6 text-center text-base text-muted-foreground md:text-lg">Latest news and updates.</p>
            </AnimationContainer>
            <AnimationContainer delay={0.2} className="w-full pt-20">
                <Blogs />
            </AnimationContainer>
        </div>
    );
};

export default BlogPage;
