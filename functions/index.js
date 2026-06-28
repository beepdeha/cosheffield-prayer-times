/* ============================================================
   Cloud Functions — send an FCM push to a topic whenever content
   is posted. Devices subscribe to topics based on the user's
   notification settings (see www/js/push.js).
   ============================================================ */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

async function pushToTopic(topic, title, body){
  if(!title && !body) return;
  try{
    await getMessaging().send({
      topic,
      notification: { title, body: body || "" },
      android: { priority: "high", notification: { channelId: "default" } }
    });
  }catch(e){ console.error("FCM send failed", topic, e); }
}

// New event → "events" topic
exports.onEventCreated = onDocumentCreated("events/{id}", async (event)=>{
  const e = event.data?.data(); if(!e) return;
  await pushToTopic("events", "New event", e.title || "A new event has been posted");
});

// New announcement → topic based on type
const ANN_TOPIC = { reminder:"reminders", death:"deaths", madrassa:"madrassa" };
const ANN_TITLE = { reminder:"New reminder", death:"Death notice", madrassa:"Madrassa announcement" };
exports.onAnnouncementCreated = onDocumentCreated("announcements/{id}", async (event)=>{
  const a = event.data?.data(); if(!a) return;
  const type = a.type || "reminder";
  const topic = ANN_TOPIC[type]; if(!topic) return;
  await pushToTopic(topic, ANN_TITLE[type] || "New announcement", a.title || "");
});

// New business offer → "offers" topic
exports.onOfferCreated = onDocumentCreated("offers/{id}", async (event)=>{
  const o = event.data?.data(); if(!o) return;
  await pushToTopic("offers", "New offer", o.title || "A business has posted an offer");
});
