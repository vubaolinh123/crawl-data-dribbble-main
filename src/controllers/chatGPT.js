import promptGPT4 from "../data/prompt-gpt4.json"

export const ReadContentTwitterWithGPT4 = async (textContent, srcImage , res) => {
  const systemPrompt = `${promptGPT4.systemPrompt}`;
  const imagePrompt = `${promptGPT4.imagePrompt}`;

  const body = {
    model: "gpt-4-vision-preview",
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: srcImage,
          },
          `${imagePrompt} ${textContent}`,
        ],
      },
    ],
  };

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const json = await resp.json();
    return json
  } catch (e) {
    console.log("Error API GPT-4", e);
  }
};
