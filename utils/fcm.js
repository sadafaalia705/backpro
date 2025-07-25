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
  if (!firebaseInitialized) {
    console.log('FCM not initialized - skipping notification');
    return;
  }
  
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
