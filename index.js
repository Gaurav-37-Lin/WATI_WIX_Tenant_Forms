const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const wixData = req.body;

  const payload = {
    data: [
      {
        First_Name: wixData.firstName,
        Last_Name: wixData.lastName,
        Rent_Tenant_Email: wixData.email,
        Mobile: wixData.mobile,
        Lead_Source: wixData.leadSource || "Website Form",
        Message: wixData.message
      }
    ]
  };

  try {
    // Step 1: Get access token from refresh token
    const tokenResp = await axios.post("https://accounts.zoho.in/oauth/v2/token", null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token"
      }
    });

    const accessToken = tokenResp.data.access_token;

    // Step 2: Push data to Zoho CRM
    const crmResp = await axios.post("https://www.zohoapis.in/crm/v5/Leads", payload, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`
      }
    });

    console.log("Lead created successfully:", crmResp.data);
    res.status(200).json({ status: "success", zohoResponse: crmResp.data });

  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    res.status(500).json({ status: "error", error: err.response?.data || err.message });
  }
});

app.get('/', (req, res) => {
  res.send("Wix → Zoho CRM middleware is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
