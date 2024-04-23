import { AndroidConfig, ConfigPlugin, withAndroidColors, withAndroidManifest, withStringsXml } from 'expo/config-plugins';

const withExpoShareMenu: ConfigPlugin = config => {

    config = withAndroidManifest(config, config => {

        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults)
        if (!mainApplication['meta-data']) {
            mainApplication['meta-data'] = []
        }
        mainApplication['meta-data']?.push({
            $: { 'android:name': 'com.supersami.foregroundservice.notification_channel_name', 'android:value': 'BPay' }
        }, {
            $: { 'android:name': 'com.supersami.foregroundservice.notification_channel_description', 'android:value': 'BPay 通知' }
        }, {
            $: { 'android:name': 'com.supersami.foregroundservice.notification_color', 'android:resource': '@color/colorPrimary' }
        })
        if (!mainApplication.service) {
            mainApplication.service = []
        }
        mainApplication.service?.push({
            $: { 'android:name': 'com.supersami.foregroundservice.ForegroundService' },
        }, {
            $: { 'android:name': 'com.supersami.foregroundservice.ForegroundServiceTask' }
        })

        const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults)
        if (!mainActivity['intent-filter']) {
            mainActivity['intent-filter'] = []
        }
        mainActivity['intent-filter'].push({
            action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
            category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
            data: [{ $: { 'android:mimeType': 'image/*' } }, { $: { 'android:mimeType': 'video/*' } }, { $: { 'android:mimeType': 'application/*' } }]
        })

        // withAndroidColors(config, config => {
        //     AndroidConfig.Colors.assignColorValue(config.modResults, { name: 'blue', value: '#00C4D1' })
        //     return config

        // })
        return config;
    });

    return config;
};

export default withExpoShareMenu;
