import { AnimationContainer, MaxWidthWrapper } from '@/components';
import React from 'react';

const Privacy = () => {
    return (
        <MaxWidthWrapper className="mx-auto mb-40 max-w-3xl px-8">
            <AnimationContainer delay={0.1} className="w-full">
                <h1 className="my-12 w-full text-center font-heading text-4xl font-bold md:text-6xl">Privacy Policy</h1>
                <p className="mb-2 mt-20 text-sm italic">Last updated: 17th June 2024</p>
                <p className="mt-4">
                    At <strong>Linkify</strong>, we are committed to protecting your privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your information when you use our website and
                    services.
                </p>

                <h2 className="mt-8 text-xl font-medium">Information We Collect</h2>

                <h3 className="mt-4 text-lg">Personal Information</h3>
                <p className="mt-8 text-muted-foreground">
                    When you register for an account or use our services, we may collect personal information that can
                    identify you, such as your name, email address, and payment information.
                </p>

                <h3 className="mt-12 text-lg font-medium">Non-Personal Information</h3>
                <p className="mt-8 text-muted-foreground">
                    We may also collect non-personal information about your use of the service, such as IP addresses,
                    browser types, referring URLs, and other technical data.
                </p>

                <h3 className="mt-8 text-lg font-medium">Cookies and Tracking Technologies</h3>
                <p className="mt-8">
                    We use cookies and similar tracking technologies to collect and store information about your
                    interactions with our website. You can manage your cookie preferences through your browser settings.
                </p>

                <h2 className="mt-12 text-xl font-medium">How We Use Your Information</h2>

                <h3 className="mt-8 text-lg">Provide and Improve Services</h3>
                <div className="mt-8">
                    We use the information we collect to:
                    <ul className="ml-8 list-disc text-muted-foreground">
                        <li>Provide, operate, and maintain our services.</li>
                        <li>Improve and personalize your experience.</li>
                        <li>Process transactions and manage your account.</li>
                    </ul>
                </div>

                <h3 className="mt-12 text-xl font-medium">Communication</h3>
                <div className="mt-8">
                    We may use your information to:
                    <ul className="ml-8 list-disc text-muted-foreground">
                        <li>Send you updates, promotional materials, and other information related to our services.</li>
                        <li>Respond to your inquiries and provide customer support.</li>
                    </ul>
                </div>

                <h3 className="mt-8 text-lg">Analytics and Research</h3>
                <div className="mt-8">
                    We use non-personal information for analytical purposes, such as:
                    <ul className="ml-8 list-disc text-muted-foreground">
                        <li>Monitoring and analyzing usage trends and preferences.</li>
                        <li>Conducting research and improving our services.</li>
                    </ul>
                </div>

                <h2 className="mt-12 text-xl font-medium">How We Share Your Information</h2>

                <h3 className="mt-8 text-lg">Service Providers</h3>
                <p className="mt-8 text-muted-foreground">
                    We may share your information with third-party service providers who assist us in operating our
                    services, such as payment processors, email services, and hosting providers.
                </p>

                <h3 className="mt-8 text-lg">Legal Requirements</h3>
                <p className="mt-8 text-muted-foreground">
                    We may disclose your information if required to do so by law or in response to valid requests by
                    public authorities.
                </p>

                <h3 className="mt-8 text-lg">Business Transfers</h3>
                <p className="mt-8 text-muted-foreground">
                    In the event of a merger, acquisition, or sale of all or a portion of our assets, your information
                    may be transferred to the acquiring entity.
                </p>

                <h2 className="mt-12 text-xl font-medium">Data Security</h2>
                <p className="mt-8 text-muted-foreground">
                    We implement appropriate technical and organizational measures to protect your personal information
                    against unauthorized access, loss, or alteration. However, no method of transmission over the
                    internet or method of electronic storage is 100% secure.
                </p>

                <h2 className="mt-12 text-xl font-medium">Data Retention</h2>
                <p className="mt-8 text-muted-foreground">
                    We retain your personal information for as long as necessary to fulfil the purposes for which it was
                    collected, comply with our legal obligations, resolve disputes, and enforce our agreements.
                </p>

                <h2 className="mt-12 text-xl font-medium">Your Rights and Choices</h2>

                <h3 className="mt-8 text-lg">Access and Update</h3>
                <p className="mt-8 text-muted-foreground">
                    You have the right to access and update your personal information. You can do this by logging into
                    your account and updating your profile settings.
                </p>

                <h3 className="mt-8 text-lg">Opt-Out</h3>
                <p className="mt-8 text-muted-foreground">
                    You can opt out of receiving promotional emails from us by following the unsubscribe instructions in
                    those emails. You may also contact us directly to opt out.
                </p>

                <h3 className="mt-8 text-lg">Data Deletion</h3>
                <p className="mt-8 text-muted-foreground">
                    You have the right to request the deletion of your personal information. Please contact us at
                    support@linkify.com to make this request.
                </p>

                <h2 className="mt-12 text-xl font-medium">Children&apos;s Privacy</h2>
                <p className="mt-8 text-muted-foreground">
                    Our services are not directed to individuals under the age of 18. We do not knowingly collect
                    personal information from children under 18. If we become aware that we have collected personal
                    information from a child under 18, we will take steps to delete such information.
                </p>

                <h2 className="mt-12 text-xl font-medium">International Data Transfers</h2>
                <p className="mt-8 text-muted-foreground">
                    Your information may be transferred to and processed in countries other than your own. We will
                    ensure that appropriate safeguards are in place to protect your personal information when it is
                    transferred across borders.
                </p>

                <h2 className="mt-12 text-xl font-medium">Changes to This Privacy Policy</h2>
                <p className="mt-8 text-muted-foreground">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                    the new Privacy Policy on our website and updating the &quot;Last updated&quot; date at the top of
                    this page.
                </p>

                <h2 className="mt-12 text-xl font-medium">Contact Us</h2>
                <p className="mt-8 text-muted-foreground">
                    If you have any questions or concerns about this Privacy Policy, please contact us at
                    support@linkify.io.
                </p>

                <p className="mt-8 font-medium">
                    By using Linkify, you acknowledge that you have read, understood, and agree to the terms of this
                    Privacy Policy.
                </p>
            </AnimationContainer>
        </MaxWidthWrapper>
    );
};

export default Privacy;
