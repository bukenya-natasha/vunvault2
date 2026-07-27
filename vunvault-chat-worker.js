/**
 * VUNVAULT AI Chat — Cloudflare Worker backend
 * ------------------------------------------------
 * This is the missing piece for the chat widget in index.html.
 * It receives {message: "..."} from the website, calls the Claude API
 * with your secret key (stored server-side, never in the browser),
 * and returns {reply: "..."}.
 *
 * SETUP (about 10 minutes, free tier is enough for a small site):
 * 1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker.
 * 2. Delete the sample code and paste this whole file in.
 * 3. Go to Settings -> Variables -> add a secret named ANTHROPIC_API_KEY
 *    with your key from https://console.anthropic.com (create one under
 *    Settings -> API Keys). Keep "Encrypt" on.
 * 4. Deploy. You'll get a URL like https://vunvault-chat.<you>.workers.dev
 * 5. In index.html, change:
 *      var ENDPOINT = '/api/chat';
 *    to your Worker URL, e.g.:
 *      var ENDPOINT = 'https://vunvault-chat.<you>.workers.dev';
 * 6. (Optional) In the Worker's Settings -> Triggers -> Routes, map it to
 *    yourdomain.com/api/chat so you can keep the original /api/chat path.
 */

const SYSTEM_PROMPT = `You are the AI assistant on the VUNVAULT website (vunvault.com).
VUNVAULT is an Africa-rooted cybersecurity company, based in Nairobi, Kenya, serving
businesses and organizations of every size — from small businesses to large
enterprises — across Africa and worldwide. Services include: Starter Scan
($100+), SME Shield ($300+), SACCO & Fintech Pro ($1,500+), and Enterprise
Retainer (custom quote) — all priced transparently in USD. Payment is accepted
by card, PayPal, Stripe, and M-Pesa (Kenya). The Academy offers free
self-paced courses: Cybersecurity Foundations, Phishing & Social Engineering
Defense, and Practical Penetration Testing.
Answer visitor questions about these services and courses helpfully and
concisely (2-4 sentences). If asked for a live quote or to book an engagement,
direct them to the contact form on the page or support@vunvault.com. Never
give specific hacking, exploit, or malware instructions — redirect those
questions to the Academy courses instead.`;

export default {
  async fetch(request, env) {
    // CORS so the widget can call this from your site
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // tighten to your domain once live
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const { message } = await request.json();
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ reply: 'Please send a message.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: message }],
        }),
      });

      const data = await apiRes.json();
      const reply = data?.content?.[0]?.text || "Sorry, I couldn't generate a response.";

      return new Response(JSON.stringify({ reply }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (err) {
      return new Response(JSON.stringify({ reply: 'Something went wrong on my end — please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
