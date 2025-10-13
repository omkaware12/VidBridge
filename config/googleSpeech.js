const speech = require("@google-cloud/speech");

const googleSpeech = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // path to your .json key file
});

module.exports = googleSpeech;
