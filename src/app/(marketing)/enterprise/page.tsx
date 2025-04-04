import React from 'react';
import AnimationContainer from '@/components/global/animation-container';
const EnterprisePage = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <AnimationContainer delay={0.1}>
                <h1 className="mt-6 text-center font-heading text-2xl font-semibold !leading-tight md:text-4xl lg:text-5xl">
                    Enterprise
                </h1>
                <p className="mt-6 text-center text-base text-muted-foreground md:text-lg">
                    Get in touch with us to learn more about our enterprise solutions.
                </p>
            </AnimationContainer>
        </div>
    );
};

export default EnterprisePage;
