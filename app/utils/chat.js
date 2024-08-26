
export const streamChatResponse = async (endpoint, messages, onChunk, onComplete) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    reader.read().then(function processText({ done, value }) {
      if (done) {
        onComplete(fullResponse);
        return;
      }

      const text = decoder.decode(value, { stream: true });
      fullResponse += text;
      onChunk(text);
      return reader.read().then(processText);
    });
  };
