import Knock, { PreferenceSet, ChannelTypePreferences, SetPreferencesProperties } from '@knocklabs/client';
import { useEffect, useState } from 'react';

const knockClient = new Knock(process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY as string);
knockClient.authenticate(process.env.NEXT_PUBLIC_KNOCK_USER_ID as string);

const PreferenceViewConfig = {
    RowSettings: {
        'new-asset': {
            title: 'New Asset',
            description: "New file uploads in workspaces you're a part of",
        },
        'new-comment': {
            title: 'Comments & mentions',
            description: 'New comments and replies to threads.',
        },
        collaboration: {
            title: 'In-app messages',
            description: 'Messages from other users on the platform',
        },
    },
    ChannelTypeLabels: {
        in_app_feed: 'In-app Feed',
        email: 'Email',
        push: 'Push',
    },
};
type preferenceViewLabels = 'new-asset' | 'new-comment' | 'collaboration';
type channelTypeLabels = 'in_app_feed' | 'email' | 'push';

// Utility function to normalize channel_types to Record<string, boolean>
const normalizeChannelTypes = (channelTypes: ChannelTypePreferences | undefined): Record<string, boolean> => {
    if (!channelTypes) return {};
    const result: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(channelTypes)) {
        if (typeof value === 'boolean') {
            result[key] = value;
        }
    }
    return result;
};

function PreferenceSettingsRow({
    preferenceType,
    preferenceKey,
    channelTypeSettings,
    onChange,
}: {
    preferenceType: string;
    preferenceKey: preferenceViewLabels;
    channelTypeSettings: Record<string, boolean>;
    onChange: Function;
}) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: '.75rem .25rem',
                gap: '1rem',
            }}
        >
            <div>
                <h2>{PreferenceViewConfig.RowSettings[preferenceKey].title}</h2>
                <p>{PreferenceViewConfig.RowSettings[preferenceKey].description}</p>
            </div>
            <div>
                {Object.keys(PreferenceViewConfig.ChannelTypeLabels).map((channelType) => {
                    const channelTypeLabel = channelType as channelTypeLabels;
                    return (
                        <div
                            key={`${preferenceKey}_${channelType}`}
                            style={{ display: 'flex', justifyContent: 'space-between' }}
                        >
                            <label htmlFor={`${preferenceKey}_${channelType}`}>
                                {PreferenceViewConfig.ChannelTypeLabels[channelTypeLabel]}
                            </label>
                            <input
                                id={`${preferenceKey}_${channelType}`}
                                type="checkbox"
                                checked={channelTypeSettings[channelType]}
                                disabled={typeof channelTypeSettings[channelType] === 'undefined'}
                                onChange={(e) => {
                                    onChange({
                                        preferenceKey,
                                        preferenceType,
                                        channelTypeSettings: {
                                            ...channelTypeSettings,
                                            [channelType]: e.target.checked,
                                        },
                                    });
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function PreferenceCenter() {
    const [localPreferences, setLocalPreferences] = useState<PreferenceSet>({
        id: 'default',
        categories: {
            collaboration: {
                channel_types: {
                    email: true,
                    in_app_feed: true,
                },
            },
            'new-asset': {
                channel_types: {
                    email: false,
                    in_app_feed: true,
                },
            },
        },
        workflows: {
            'new-comment': {
                channel_types: {
                    email: true,
                },
            },
        },
        channel_types: {},
    });

    useEffect(() => {
        async function fetchPreferences() {
            const preferences = await knockClient.user.getPreferences();
            setLocalPreferences(preferences);
        }
        fetchPreferences();
    }, [knockClient]);

    const onPreferenceChange = async ({
        preferenceKey,
        preferenceType,
        channelTypeSettings,
    }: {
        preferenceKey: preferenceViewLabels;
        preferenceType: string;
        channelTypeSettings: Record<string, boolean>;
    }) => {
        const preferenceUpdate: PreferenceSet = {
            ...localPreferences,
            categories: localPreferences?.categories ?? {},
            workflows: localPreferences?.workflows ?? {},
        };

        if (preferenceType === 'category') {
            preferenceUpdate.categories = {
                ...preferenceUpdate.categories,
                [preferenceKey]: {
                    channel_types: channelTypeSettings,
                },
            };
        }
        if (preferenceType === 'workflow') {
            preferenceUpdate.workflows = {
                ...preferenceUpdate.workflows,
                [preferenceKey]: {
                    channel_types: channelTypeSettings,
                },
            };
        }

        const preferences = await knockClient.user.setPreferences(preferenceUpdate as SetPreferencesProperties);
        setLocalPreferences(preferences);
    };

    if (!localPreferences) {
        return null;
    }

    return (
        <div className="preferences">
            {Object.keys(localPreferences?.categories ?? {}).map((category) => {
                const preferenceKey = category as preferenceViewLabels;
                return (
                    <PreferenceSettingsRow
                        key={category}
                        preferenceType="category"
                        preferenceKey={preferenceKey}
                        channelTypeSettings={
                            localPreferences?.categories?.[category] &&
                            typeof localPreferences.categories[category] === 'object' &&
                            localPreferences.categories[category] !== null &&
                            'channel_types' in localPreferences.categories[category]
                                ? normalizeChannelTypes(localPreferences.categories[category].channel_types)
                                : {}
                        }
                        onChange={onPreferenceChange}
                    />
                );
            })}
            {Object.keys(localPreferences?.workflows ?? {}).map((workflow) => {
                const preferenceKey = workflow as preferenceViewLabels;
                return (
                    <PreferenceSettingsRow
                        key={workflow}
                        preferenceType="workflow"
                        preferenceKey={preferenceKey}
                        channelTypeSettings={
                            localPreferences?.workflows?.[workflow] &&
                            typeof localPreferences.workflows[workflow] === 'object' &&
                            localPreferences.workflows[workflow] !== null &&
                            'channel_types' in localPreferences.workflows[workflow]
                                ? normalizeChannelTypes(localPreferences.workflows[workflow].channel_types)
                                : {}
                        }
                        onChange={onPreferenceChange}
                    />
                );
            })}
        </div>
    );
}
