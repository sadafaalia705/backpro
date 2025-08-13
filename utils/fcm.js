// utils/fcm.js
import admin from 'firebase-admin';

// Initialize Firebase Admin using ENV variables
let firebaseInitialized = false;

if (!admin.apps.length && process.env.private_key && process.env.client_email && process.env.project_id) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.project_id,
        privateKey: process.env.private_key.replace(/\\n/g, '\n'),
        clientEmail: process.env.client_email,
      }),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
  }
} else if (!process.env.private_key || !process.env.client_email || !process.env.project_id) {
  console.warn('Firebase credentials not found in environment variables. FCM notifications will be disabled.');
}

export const sendFCMNotification = async (fcmToken, message) => {
  console.log('sendFCMNotification called with:', { fcmToken, message });
  
  try {
    // Check if it's an Expo push token (starts with ExponentPushToken)
    if (fcmToken.startsWith('ExponentPushToken')) {
      // For Expo push tokens, use Expo's push notification service
      console.log('Detected Expo push token, sending via Expo push service');
      
      const expoPushMessage = {
        to: fcmToken,
        sound: 'default',
        title: '🚰 WATER ALARM!',
        body: message,
        data: { type: 'water_alarm' },
        priority: 'high',
        channelId: 'water-alarms',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoPushMessage),
      });

      if (response.ok) {
        console.log(`Expo notification sent successfully to ${fcmToken}`);
      } else {
        const errorData = await response.text();
        console.error(`Failed to send Expo notification: ${response.status} - ${errorData}`);
      }
      return;
    }
    
    // For regular FCM tokens, use Firebase (if initialized)
    if (!firebaseInitialized) {
      console.log('FCM not initialized - skipping Firebase notification');
      return;
    }
    
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "🚰 WATER ALARM!",
        body: message,
        sound: "default",
        priority: "high",
        channelId: "water-alarms",
      },
      android: {
        notification: {
          sound: "default",
          priority: "high",
          channelId: "water-alarms",
          vibrate: [0, 250, 250, 250],
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });
    console.log(`Firebase notification sent to ${fcmToken}`);
  } catch (err) {
    console.error("Notification send error:", err);
  }
};
