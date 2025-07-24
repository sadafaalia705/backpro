  //  // backend/utils/fcm.js
  //  import admin from 'firebase-admin';
  //  import serviceAccount from '../config/firebaseServiceAccount.json' assert { type: "json" };

  //  if (!admin.apps.length) {
  //    admin.initializeApp({
  //      credential: admin.credential.cert(serviceAccount),
  //    });
  //  }

  //  export const sendFCMNotification = async (fcmToken, message) => {
  //    console.log('sendFCMNotification called with:', { fcmToken, message });
  //    try {
  //       await admin.messaging().send({
  //           token: fcmToken,
  //           notification: {
  //             title: "Water Reminder",
  //             body: message
  //           },
  //           android: {
  //             notification: {
  //               sound: "default"
  //             }
  //           }
  //         });
  //      console.log(`Notification sent to ${fcmToken}`);
  //    } catch (err) {
  //      console.error("FCM send error:", err);
  //    }
  //  };

  // backend/utils/fcm.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Path to Firebase service account file
const serviceAccountPath = path.join(__dirname, '../config/firebaseServiceAccount.json');

// ✅ Read JSON file and parse
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// ✅ Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const sendFCMNotification = async (fcmToken, message) => {
  console.log('sendFCMNotification called with:', { fcmToken, message });
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "Water Reminder",
        body: message
      },
      android: {
        notification: {
          sound: "default"
        }
      }
    });
    console.log(`Notification sent to ${fcmToken}`);
  } catch (err) {
    console.error("FCM send error:", err);
  }
};
