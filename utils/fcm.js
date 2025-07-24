// utils/fcm.js
import admin from 'firebase-admin';

// Initialize Firebase Admin using ENV variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.project_id,
      privateKey: process.env.private_key.replace(/\\n/g, '\n'),
      clientEmail: process.env.client_email,
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
