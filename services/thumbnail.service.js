const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { llm } = require("../config/llm.js");
const { thumbnailClient } = require("../config/thumbnailClient.js");

module.exports.generateThumbnail = async (transcript) => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert visual AI. Create a YouTube thumbnail idea as JSON.

      Respond ONLY with a JSON object like this:
      {{
        "background": "short description",
        "visuals": ["object1", "object2"],
        "text": "short catchy title"
      }}

      The JSON content should come from the following transcript.`,
    ],
    ["human", "{user_input}"],
  ]);

  const chain = prompt.pipe(llm);
  const llmResult = await chain.invoke({ user_input: transcript });

  const title = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert visual AI. 
Create exactly 6 short, catchy YouTube titles based on the transcript. 
Return only the titles, nothing else, no explanations or extra text. 
Format the output as a numbered list from 1 to 6.`
  ],
  ["human", "{user_input}"],
]);

  const titleChain = title.pipe(llm);
  const llmTiltleResult = await titleChain.invoke({ user_input: transcript });

const description = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert YouTube content writer trained on the most successful creators across all genres, including tech, education, entertainment, motivation, and lifestyle.

Your task is to write a perfect YouTube video description based on the provided transcript.

Guidelines:
- Adapt your tone naturally to match the video's content and mood (informative, friendly, inspiring, etc.).
- Begin with an engaging hook that captures viewer interest.
- Summarize the main idea of the video and highlight key insights, exciting moments, or emotional takeaways from the transcript.
- Naturally include important keywords for search visibility based on the video topic.
- Include a call-to-action if it fits naturally, encouraging engagement (watching, subscribing, commenting, etc.).
- Format the description in the style that best suits the video — it can be one paragraph, a few short paragraphs, bullet points, or timestamps if it enhances clarity and engagement.
- Return only the description text — no extra labels or explanations.`
  ],
  ["human", "{user_input}"],
]);


  const descriptionChain = description.pipe(llm);
  const llmDescriptionResult = await descriptionChain.invoke({ user_input: transcript });

const tags = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an advanced YouTube SEO and content strategist trained to extract **dynamic and context-aware hashtags** from video transcripts.

Your task: Analyze the provided transcript carefully and generate up to **10 single-word hashtags** that best represent the video’s **main topic, tone, audience, and unique elements**.

Guidelines:
- Each hashtag must:
  - Start with "#"
  - Contain **only one word** (no spaces or punctuation)
  - Be **relevant to the specific transcript** — not generic
  - Reflect the **core subject**, **key themes**, **emotions**, or **target audience**
- Prefer meaningful, trending, and niche-relevant terms.
- Avoid duplicates, overly broad tags, or random buzzwords.
- Output format: hashtags separated by commas, e.g.  
  "#AI, #innovation, #productivity, #workflow"
- Return **only** the hashtags — no extra explanation or text.`,
  ],
  ["human", "{user_input}"],
]);


  const tagsChain = tags.pipe(llm);
  const llmTagsResult = await tagsChain.invoke({ user_input: transcript });


  let thumbnailJSON;
  let finalTitle;
  let finalDescription;
  let finalTags; 
  try {
    thumbnailJSON = JSON.parse(llmResult?.content || "{}");
    finalTitle = llmTiltleResult?.content || thumbnailJSON.text || "Untitled";
    finalDescription = llmDescriptionResult?.content || "No description available.";
    finalTags = llmTagsResult?.content || [];
  } catch {
    thumbnailJSON = { background: "abstract", visuals: ["error"], text: "Generation Failed" };
  }

  const imagePrompt = `${thumbnailJSON.background} background, ${thumbnailJSON.visuals.join(", ")}, with bold text: "${thumbnailJSON.text}"`;

  const thumbnailRes = await thumbnailClient.images.generate({
    model: "black-forest-labs/flux-schnell",
    response_format: "b64_json",
    width: 1024,
    height: 576,
    num_inference_steps: 4,
    prompt: imagePrompt,
  });

  return {
    thumbnailBase64: thumbnailRes.data[0].b64_json,
    thumbnailJSON,
    llmPrompt: llmResult?.content || "",
    finalTitle,
    finalDescription,
    finalTags,
  };
};
