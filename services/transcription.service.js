const fs = require("fs");
const googleSpeech = require("../config/googleSpeech.js");

module.exports.transcribeAudio = async (audioFilePath) => {
  const audioBytes = fs.readFileSync(audioFilePath).toString("base64");

  const [operation] = await googleSpeech.longRunningRecognize({
    audio: { content: audioBytes },
    config: { encoding: "LINEAR16", sampleRateHertz: 16000, languageCode: "en-US" },
  });

  const [response] = await operation.promise();
  const transcript = response.results.map(r => r.alternatives[0].transcript).join("\n");
  return transcript;
};
