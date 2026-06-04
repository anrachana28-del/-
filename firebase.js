firebase.initializeApp({
  apiKey: "AIzaSyBuKVB0z6NVtepmjE33qXxrxs8RcmCOwd0",
  authDomain:"create-db14a.firebaseapp.com",
  projectId:"create-db14a"
});
// ✅ global db
window.db = firebase.firestore();