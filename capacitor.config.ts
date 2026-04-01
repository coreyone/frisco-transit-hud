import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.friscotransit.app',
	appName: 'Frisco Transit',
	webDir: 'build',
	bundledWebRuntime: false,
	server: {
		androidScheme: 'https',
	},
	plugins: {
		LocalNotifications: {
			smallIcon: 'ic_stat_icon_config_sample',
			iconColor: '#b73324',
		},
	},
};

export default config;
