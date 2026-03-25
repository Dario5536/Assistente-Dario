exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    if (body.type === 'contact') {
      const { name, phone, mode, timestamp, messageCount } = body;

      const emailPayload = {
        from: 'Assistente Dario <onboarding@resend.dev>',
        to: ['darioacquafredda@gmail.com'],
        subject: `🔔 Nuovo prospect dal chatbot — ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #0a1628; margin-bottom: 4px;">Nuovo prospect dal chatbot</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Qualcuno ha richiesto una consulenza gratuita</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
              <p style="margin: 8px 0;"><strong>👤 Nome:</strong> ${name}</p>
              <p style="margin: 8px 0;"><strong>📞 Telefono:</strong> ${phone}</p>
              <p style="margin: 8px 0;"><strong>💬 Messaggi scambiati:</strong> ${messageCount || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>📅 Data e ora:</strong> ${timestamp}</p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">Assistente AI di Dario Acquafredda</p>
          </div>
        `
      };

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify(emailPayload)
      });

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
