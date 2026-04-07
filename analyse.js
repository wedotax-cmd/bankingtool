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

  const userContent = body.messages[0].content;
  const textItem = userContent.find(c => c.type === 'text');
  const docItems = userContent.filter(c => c.type === 'document');

  // Split each PDF into chunks of ~130K tokens (100KB base64)
  // 1 byte base64 ≈ 0.325 tokens, so 130K tokens ≈ 400KB base64
  const MAX_B64 = 400000; // chars

  var chunks = [];
  for (var i = 0; i < docItems.length; i++) {
    var b64 = docItems[i].source.data;
    if (b64.length <= MAX_B64) {
      chunks.push([docItems[i]]);
    } else {
      // Split into multiple chunks
      for (var start = 0; start < b64.length; start += MAX_B64) {
        var slice = b64.substring(start, start + MAX_B64);
        // Pad to valid base64 length
        while (slice.length % 4 !== 0) slice += '=';
        chunks.push([{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: slice } }]);
      }
    }
  }

  // Process all chunks and merge results
  var allTransactions = [];
  
  for (var c = 0; c < chunks.length; c++) {
    var content = chunks[c].concat([{ type: 'text', text: textItem.text }]);
    
    try {
      var resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4000, messages: [{ role: 'user', content: content }] })
      });

      var respText = await resp.text();
      var respData;
      try { respData = JSON.parse(respText); } catch(e) { continue; }
      
      if (respData.error) continue;
      
      var raw = '';
      for (var k = 0; k < respData.content.length; k++) raw += (respData.content[k].text || '');
      raw = raw.replace(/```json|```/gi, '').trim();
      
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) allTransactions = allTransactions.concat(parsed);
      } catch(e) { continue; }
      
      // Rate limit delay between chunks
      if (c < chunks.length - 1) await new Promise(r => setTimeout(r, 3000));
      
    } catch(err) { continue; }
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(allTransactions) }] })
  };
};
