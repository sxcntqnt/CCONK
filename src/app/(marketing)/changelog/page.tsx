import AnimationContainer from '@/components/global/animation-container';
import React from 'react';

const ChangeLogPage = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <AnimationContainer delay={0.1}>
                <h1 className="mt-6 text-center font-heading text-2xl font-semibold !leading-tight md:text-4xl lg:text-5xl">
                    Change Log
                </h1>
                <p className="mt-6 text-center text-base text-muted-foreground md:text-lg">
                    Stay up to date with the latest changes to our platform.
                </p>
            </AnimationContainer>
        </div>
    );
};

export default ChangeLogPage;
