require('dotenv').config();

const express = require('express');
const { createWebSocketServer } = require('./websocket/websocketServer');
const app = express();
const { broadcastLead } = createWebSocketServer();

console.log(
  process.env.META_PAGE_ACCESS_TOKEN ? 'Token loaded' : 'Token missing'
);

app.use(express.json());
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN =
  process.env.WEBHOOK_VERIFY_TOKEN || 'unque-test-token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');

    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});



async function fetchLead(leadId) {
  const response = await fetch(
    `https://graph.facebook.com/v26.0/${leadId}?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`
  );

  if (!response.ok) {
  const errorBody = await response.text();
  throw new Error(`Failed to fetch lead: ${response.status} ${errorBody}`);
}

  return response.json();
}

app.post('/webhook', async (req, res) => {
  console.log('Meta webhook received');
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const leadId = req.body.entry?.[0]?.changes?.[0]?.value?.leadgen_id;

    if (!leadId) {
       console.log("Lead is not present");
      return res.sendStatus(200);
    }

    const lead = await fetchLead(leadId);

    const leadData = {};

lead.field_data.forEach((field) => {
  leadData[field.name] = field.values[0];
});

    console.log('Lead fetched from Meta:');
    console.log(JSON.stringify(lead, null, 2));

   broadcastLead({
  name: leadData.full_name,
  email: leadData.email,
  phone: leadData.phone_number
});

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing lead:', error);
    res.sendStatus(500);
  }
});



app.post('/test-lead', (req, res) => {
  const lead = req.body;

  broadcastLead(lead);

  res.json({
    success: true
  });
});

app.get('/', (req, res) => {
  res.send('UNQUE backend is running');
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});

