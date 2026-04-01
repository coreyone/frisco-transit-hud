import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Coordinates } from '$lib/transit/types';

export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Modern geolocation retrieval with high-accuracy and permission handling.
 * Leverages Capacitor on mobile and Web Geolocation API on desktop.
 */
export async function getCurrentLocation(
	fallback: Coordinates,
): Promise<Coordinates> {
	try {
		if (isNativePlatform()) {
			const permission = await Geolocation.checkPermissions();
			if (permission.location !== 'granted') {
				await Geolocation.requestPermissions();
			}
		}

		const position = await Geolocation.getCurrentPosition({
			enableHighAccuracy: true,
			timeout: 10_000,
			maximumAge: 0
		});

		return {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
		};
	} catch (error) {
		console.warn('Modern location acquisition failed, reverting to last known vector', error);
		return fallback;
	}
}

/**
 * Real-time location stream for dynamic 'Nearby' updates.
 * Essential for the 'ideal customer' moving through the transit network.
 */
export async function watchLocation(
	callback: (coords: Coordinates) => void
): Promise<() => void> {
	try {
		if (isNativePlatform()) {
			await Geolocation.requestPermissions();
		}

		const watchId = await Geolocation.watchPosition({
			enableHighAccuracy: true,
			timeout: 15_000,
			maximumAge: 0
		}, (position) => {
			if (position) {
				callback({
					lat: position.coords.latitude,
					lng: position.coords.longitude
				});
			}
		});

		return async () => {
			await Geolocation.clearWatch({ id: watchId });
		};
	} catch (error) {
		console.warn('Location streaming unavailable', error);
		return () => {};
	}
}

export async function pulseUrgency(style: 'light' | 'medium' = 'light') {
	try {
		await Haptics.impact({
			style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light,
		});
	} catch (error) {
		console.warn('Haptics unavailable', error);
	}
}

export async function scheduleDepartureNotification(input: {
	id: number;
	title: string;
	body: string;
	at: Date;
}) {
	try {
		await LocalNotifications.requestPermissions();
		await LocalNotifications.schedule({
			notifications: [
				{
					id: input.id,
					title: input.title,
					body: input.body,
					schedule: { at: input.at },
				},
			],
		});
	} catch (error) {
		console.warn('Local notification scheduling failed', error);
	}
}

export async function initPushNotifications() {
	if (!isNativePlatform()) {
		return { supported: false as const };
	}

	try {
		const permissions = await PushNotifications.requestPermissions();

		if (permissions.receive !== 'granted') {
			return { supported: false as const };
		}

		await PushNotifications.register();

		PushNotifications.addListener('registration', (token) => {
			console.info('Push token available', token.value);
		});

		PushNotifications.addListener(
			'pushNotificationReceived',
			(notification) => {
				console.info('Push received', notification);
			},
		);

		return { supported: true as const };
	} catch (error) {
		console.warn('Push notification bootstrap failed', error);
		return { supported: false as const };
	}
}

export async function watchConnectivity(
	callback: (status: { connected: boolean; connectionType: string }) => void,
) {
	const status = await Network.getStatus();
	callback({
		connected: status.connected,
		connectionType: status.connectionType,
	});

	const listener = await Network.addListener(
		'networkStatusChange',
		(nextStatus) => {
			callback({
				connected: nextStatus.connected,
				connectionType: nextStatus.connectionType,
			});
		},
	);

	return () => listener.remove();
}

export async function onAppResume(callback: () => void) {
	const listener = await App.addListener('resume', callback);
	return () => listener.remove();
}
