// server/services/bedrockService.js
import pkg from '@aws-sdk/client-bedrock-runtime';

const { BedrockRuntimeClient, InvokeModelCommand } = pkg;

const client = new BedrockRuntimeClient({ region: "ap-southeast-1" });

/**
 * Summarizes the given notes using the Bedrock Anthropic Claude model (Messages API).
 * @param {string} notes - The meeting notes to summarize.
 * @returns {Promise<string>} The generated summary.
 */
export async function generateSummary(notes) {
  if (!InvokeModelCommand) {
    throw new Error("InvokeModelCommand is not available. Check Bedrock SDK import.");
  }

  const systemPrompt = "You are a helpful assistant that rewrites messy meeting notes into a clean, neutral business summary for client use.";

  const userMessageContent = `Rephrase the following meeting notes into a clear and professional summary in a business casual tone. Use this format:

  Start with one sentence summarizing the purpose or outcome of the meeting.

  - Use bullet points to list key decisions or action items
  - Rewrite fragmented or informal inputs into clear, concise points
  - Maintain a polite, neutral tone that’s easy to read

  End with one sentence that highlights any follow-ups or what to expect next.

  Meeting notes:
  ${notes}`;


  const params = {
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userMessageContent,
            },
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    }),
  };

  try {
    const command = new InvokeModelCommand(params);
    const response = await client.send(command);

    const decoder = new TextDecoder('utf-8');
    const data = decoder.decode(response.body);

    const json = JSON.parse(data);
    return json.content[0].text;
  } catch (error) {
    console.error("Error invoking Bedrock model:", error);
    throw error;
  }
}