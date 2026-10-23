const { streamGemini } = require('./llm');
const { systemPrompt } = require('./prompt');
const { runTool, toolDeclarations, toolLabel } = require('./tools');

const MAX_STEPS = 5;

/**
 * Vòng lặp agent: model -> tool -> model.
 * Sinh các sự kiện: text | tool | tool_done | source
 */
async function* runAgent(history, signal = { aborted: false }) {
  const contents = [...history];
  let toolId = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const modelParts = [];
    const calls = [];
    // Bước cuối: không cho gọi tool nữa để buộc agent trả lời.
    const tools = step === MAX_STEPS - 1 ? [] : toolDeclarations;

    for await (const part of streamGemini(contents, systemPrompt(), tools)) {
      if (signal.aborted) return;
      modelParts.push(part);
      if (part.text) yield { type: 'text', text: part.text };
      if (part.functionCall) calls.push(part.functionCall);
    }
    if (!calls.length) return;

    contents.push({ role: 'model', parts: modelParts });
    const responses = [];
    for (const call of calls) {
      const id = ++toolId;
      const args = call.args ?? {};
      yield { type: 'tool', id, name: call.name, label: toolLabel(call.name, args) };
      const result = await runTool(call.name, args);
      yield { type: 'tool_done', id, summary: result.summary };
      for (const s of result.sources ?? []) yield { type: 'source', title: s.title, url: s.url };
      responses.push({ functionResponse: { name: call.name, response: { result: result.output } } });
    }
    contents.push({ role: 'user', parts: responses });
  }
}

module.exports = { runAgent };
