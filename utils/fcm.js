// utils/fcm.js
import admin from 'firebase-admin';

// Initialize Firebase Admin using ENV variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export const sendFCMNotification = async (fcmToken, message) => {
  console.log('sendFCMNotification called with:', { fcmToken, message });
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "Water Reminder",
        body: message,
      },
      android: {
        notification: {
          sound: "default",
        },
      },
    });
    console.log(`Notification sent to ${fcmToken}`);
  } catch (err) {
    console.error("FCM send error:", err);
  }
};
