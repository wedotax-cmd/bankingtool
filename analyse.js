exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not configured' } }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: { message: 'Bad request' } }) }; }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4000, messages: body.messages })
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) { return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: { message: 'Anthropic returned: ' + text.substring(0, 300) } }) }; }
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: { message: err.message } }) };
  }
};
