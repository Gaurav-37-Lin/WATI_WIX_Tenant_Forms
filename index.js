const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Webhook is live and listening.");
});

app.post("/webhook", async (req, res) => {
  const data = req.body.data;
  console.log("Incoming from Wix:", data);

  const payload = {
    data: [
      {
        First_Name: data.firstName,
        Last_Name: data.lastName,
        Mobile: data.mobile,
        Rent_Tenant_Email: data.email,
        Rent_Tenant_City: data.city,
        Lead_Source: "Website",
        Message: data.message
      }
    ]
  };

  try {
    // Step 1: Get Access Token using Refresh Token
    const tokenResp = await axios.post("https://accounts.zoho.in/oauth/v2/token", null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token"
      }
    });

    const accessToken = tokenResp.data.access_token;

    // Step 2: Send lead data to Zoho CRM
    const crmResp = await axios.post("https://www.zohoapis.in/crm/v5/Leads", payload, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Lead successfully created:", crmResp.data);
    res.status(200).json({ status: "success", data: crmResp.data });

  } catch (error) {
    console.error("Error creating lead:", error.response?.data || error.message);
    res.status(500).json({ status: "error", message: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
