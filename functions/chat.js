export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();

    if (body.type === 'save_message') {
      const { session_id, role, messaggio, nome, telefono } = body;
      await fetch(`${env.SUPABASE_URL}/rest/v1/conversazioni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ session_id, role, messaggio, nome: nome || null, telefono: telefono || null })
      });
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (body.type === 'update_contact') {
      await fetch(`${env.SUPABASE_URL}/rest/v1/conversazioni?session_id=eq.${body.session_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ nome: body.nome, telefono: body.telefono })
      });
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (body.type === 'contact') {
      const { name, phone, timestamp, messageCount } = body;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Assistente Dario <onboarding@resend.dev>',
          to: ['darioacquafredda@gmail.com'],
          subject: `🔔 Nuovo prospect dal chatbot — ${name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
              <h2 style="color:#0a1628;margin-bottom:4px;">Nuovo prospect dal chatbot</h2>
              <p style="color:#666;font-size:14px;margin-bottom:24px;">Qualcuno ha richiesto una consulenza</p>
              <div style="background:white;border-radius:8px;padding:20px;margin-bottom:16px;">
                <p style="margin:8px 0;"><strong>👤 Nome:</strong> ${name}</p>
                <p style="margin:8px 0;"><strong>📞 Telefono:</strong> ${phone}</p>
                <p style="margin:8px 0;"><strong>💬 Messaggi:</strong> ${messageCount || 'N/A'}</p>
                <p style="margin:8px 0;"><strong>📅 Data:</strong> ${timestamp}</p>
              </div>
              <p style="color:#888;font-size:12px;text-align:center;">Assistente AI di Dario Acquafredda</p>
            </div>`
        })
      });
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  });
}
