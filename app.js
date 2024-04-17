const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
require('dotenv').config();


function healthCheckLogger(req, res, next) {
    console.log(`Health Check - Timestamp: ${new Date().toISOString()}, URL: ${req.originalUrl}`);
    next();
}

async function checkHealth(url, serviceName) {
    try {
        const response = await axios.get(url);
        return {
            service: serviceName,
            status: response.data.status,
            checks: response.data.checks,
        };
    } catch (error) {
        console.error(`Error checking health for ${serviceName}: ${error.message}`);
        return { service: serviceName, status: "Error", message: error.message };
    }
}

app.get("/health-check", healthCheckLogger, async (req, res) => {
    if (!process.env.PRODUCT_SERVICE_URL || !process.env.ORDER_SERVICE_URL) {
        console.error("Missing environment variables for service URLs.");
        return res.status(500).json({ error: "Internal Server Error" });
    }
    const services = [
        {
            url: process.env.PRODUCT_SERVICE_URL,
            name: "PRODUCT SERVICE",
        },
        {
            url: process.env.ORDER_SERVICE_URL,
            name: "ORDER SERVICE",
        },
    ];

    const healthChecks = await Promise.all(
        services.map((service) => checkHealth(service.url, service.name))
    );

    console.log("Health Checks:");
    healthChecks.forEach((check) => {
        console.log(`${check.service}: ${check.status}`);
    });

    res.json(healthChecks);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
