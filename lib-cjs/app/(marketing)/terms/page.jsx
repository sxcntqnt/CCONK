"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@/components");
const link_1 = __importDefault(require("next/link"));
const TermsPage = () => {
    return (<components_1.MaxWidthWrapper className="mx-auto mb-40 max-w-3xl px-8">
            <components_1.AnimationContainer delay={0.1} className="w-full">
                <h1 className="my-12 w-full text-center font-heading text-4xl font-bold md:text-6xl">
                    Terms and Conditions
                </h1>
                <p className="mb-2 mt-20 text-sm italic">Last updated: 17th June 2024</p>
                <p className="mt-4">
                    Welcome to Linkify. These terms and conditions outline the rules and regulations for the use of
                    Linkify&apos;s website and services.
                </p>

                <h2 className="mt-8 text-xl font-medium">Acceptance of Terms</h2>

                <p className="mt-8 text-muted-foreground">
                    By accessing and using Linkify, you accept and agree to be bound by these terms and conditions. If
                    you do not agree to these terms, you may not use our website or services.
                </p>

                <h2 className="mt-12 text-xl font-medium">Changes to Terms</h2>
                <p className="mt-8 text-muted-foreground">
                    Linkify reserves the right to modify these terms at any time. We will notify you of any changes by
                    updating the &quot;Last updated&quot; data at the top of this page. You continued use of our website
                    and services after any modifications indicates your acceptance of the new terms.
                </p>

                <h2 className="mt-12 text-xl font-medium">Use of Services</h2>

                <h3 className="mt-8 text-lg">Eligibility</h3>
                <p className="mt-8">
                    To use Linkify, you must be at least 18 years old and capable of entering into a binding contact.
                </p>

                <h3 className="mt-8 text-lg">Account Registration</h3>
                <div className="mt-8">
                    <ul className="ml-8 list-disc text-muted-foreground">
                        <li>You must provide accurate and complete information during the registration process.</li>
                        <li>
                            You are responsible for maintaining the confidentiality of your account information and for
                            all activities that occur under your account.
                        </li>
                        <li>You agree to notify us immediately of any unantuhorized use of your account.</li>
                    </ul>
                </div>

                <h3 className="mt-8 text-lg">Acceptable Use</h3>
                <div className="mt-8">
                    You agree not to use Linkify for any unlawful or prohibited activities, including but not limited
                    to:
                    <ul className="ml-8 list-disc text-muted-foreground">
                        <li>Uploading or sharing content that is offensive, harmful, or violates any laws.</li>
                        <li>Using the service to distribute spam or malicious content.</li>
                        <li>
                            Attempting to gain unauthorized access to other user accounts or Linkify&apos;s systems.
                        </li>
                    </ul>
                </div>

                <h2 className="mt-12 text-xl font-medium">Link Shortening and Management</h2>

                <h3 className="mt-8 text-lg">URL Shortening</h3>
                <p className="mt-8 text-muted-foreground">
                    Linkify provides a URL shortening service that allows you to create shortened links from long URLs.
                    You agree not to use this service to create links to illegal or harmful content.
                </p>

                <h3 className="mt-8 text-lg">Analytics</h3>
                <p className="mt-8 text-muted-foreground">
                    Linkify offers analytics for your shortened URLs. You agree to use this data responsibly and comply
                    with all applicable privacy laws.
                </p>

                <h3 className="mt-8 text-lg">QR Code Generation</h3>
                <p className="mt-8 text-muted-foreground">
                    You may generate QR codes for your shortened URLs. You agree not to use QR codes for any malicious
                    purposes.
                </p>

                <h3 className="mt-8 text-lg">Business Transfers</h3>
                <p className="mt-8 text-muted-foreground">
                    In the event of a merger, acquisition, or sale of all or a portion of our assets, your information
                    may be transferred to the acquiring entity.
                </p>

                <h2 className="mt-12 text-xl font-medium">User Content</h2>

                <h3 className="mt-8 text-lg">Ownership</h3>

                <p className="mt-8 text-muted-foreground">
                    You retain ownership of any content you upload or create using Linkify. However, by uploading or
                    creating content, you grant Linkify a worldwide, non-exclusive, royalty-free license to use,
                    reproduce, and display your content as necessary to provide our services.
                </p>

                <h2 className="mt-12 text-xl font-medium">Responsibility</h2>
                <p className="mt-8 text-muted-foreground">
                    You are solely responsible for the content you upload or create. Linkify does not endorse or assume
                    any liability for user content.
                </p>

                <h2 className="mt-12 text-xl font-medium">Privacy</h2>

                <p className="mt-8 text-muted-foreground">
                    Your privacy is important to us. Please review our{' '}
                    <link_1.default href="/privacy" className="underline">
                        Privacy Policy
                    </link_1.default>{' '}
                    to understand how we collect, use, and protect your information.
                </p>

                <h2 className="mt-12 text-xl font-medium">Termination</h2>
                <p className="mt-8 text-muted-foreground">
                    Linkify reserves the right to suspend or terminate your account at any time, with or without notice,
                    for any reason, including but not limited to violation of these terms.
                </p>

                <h2 className="mt-12 text-xl font-medium">Disclaimers and Limitations of Liability</h2>

                <h3 className="mt-8 text-lg">No Warranties</h3>
                <p className="mt-8 text-muted-foreground">
                    Linkify is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not warrant
                    that the service will be uninterrupted, error-free, or free from viruses or other harmful
                    components.
                </p>

                <h3 className="mt-8 text-lg">Limitation of Liability</h3>
                <p className="mt-8 text-muted-foreground">
                    In no event shall Linkify be liable for any indirect, incidental, special, or consequential damages
                    arising out of or in connection with your use of the service.
                </p>

                <h2 className="mt-12 text-xl font-medium">Governing Law</h2>
                <p className="mt-8 text-muted-foreground">
                    These terms shall be governed and construed in accordance with the laws of India, without regard to
                    its conflict of law provisions.
                </p>

                <h2 className="mt-12 text-xl font-medium">Contact Us</h2>
                <p className="mt-8 text-muted-foreground">
                    If you have any questions or concerns about this Privacy Policy, please contact us at
                    support@linkify.io.
                </p>

                <p className="mt-8 font-medium">
                    By using Linkify, you acknowledge that you have read, understood, and agree to be bound by these
                    terms and conditions.
                </p>
            </components_1.AnimationContainer>
        </components_1.MaxWidthWrapper>);
};
exports.default = TermsPage;
