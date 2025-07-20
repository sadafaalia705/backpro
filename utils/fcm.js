   // backend/utils/fcm.js
   import admin from 'firebase-admin';
   import serviceAccount from '../config/firebaseServiceAccount.json' assert { type: "json" };

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