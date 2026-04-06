import axios from "axios";

import * as cheerio from "cheerio";
import { createServer } from "http";

import * as dotenv from "dotenv";

import { Gauge, register } from "prom-client";

dotenv.config();

const refreshTime = process.env.REFRESH_TIME ? Number.parseInt(process.env.REFRESH_TIME) : 15;
const port = 8080;
const fuelStationsEnv = process.env.FUEL_STATIONS;

if (!fuelStationsEnv) {
    throw new Error("You need to supply at least one fuel station to FUEL_STATIONS.")
}

const fuelStations = fuelStationsEnv.split(" ");

const gauge = new Gauge({
    name: "fuel_price",
    help: "The current fuel price",
    labelNames: ["fuelType", "location"]
});

const fetchPrices = async () => {
    fuelStations.forEach(async (fuelStation) => {
        const res = await axios.get(`https://www.classic-oil.de/tankstellen/${fuelStation}/`);

        const $ = cheerio.load(res.data);

        const allPrices = $(".tankstellen-preise-top");

        let price: number = -1;
        let productName: string = "";

        allPrices.children().each((i, el) => {
            if (el.attribs.class.includes("tankstellen-preise-preis")) {
                price = Number.parseFloat($(el).text().replaceAll(" ", "").replaceAll("\n", "").replaceAll(",", "."));
                console.log(new Date(), ",", fuelStation, ":", productName, ",", price);
                gauge.set({ fuelType: productName, location: fuelStation }, price)
            }
            else {
                productName = $(el).text().trim();
            }
        })
    });

    setTimeout(fetchPrices, 1000 * 60 * refreshTime);
}


fetchPrices();

const server = createServer(async (req, res) => {
    if (req.url === '/metrics') {
        res.writeHead(200, {
            'content-type': register.contentType
        });
        res.end(await register.metrics());
    }
    else {
        res.writeHead(400)
        res.end();
    }
})

server.listen(port);