// Import and configure the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// The messagingSenderId is required for background notifications.
// In this environment, we expect the user to configure this.
// If not configured, background notifications might not work, but foreground will.
firebase.initializeApp({
  messagingSenderId: "103920392039" // Placeholder - user should update this in their console
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'UniAce Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update from UniAce.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
