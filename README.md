# Classic Fuel Scraper

This is a scraper, that targets any website by Classic. It extracts all of the fuel prices it can find and exposes them as a Prometheus endpoint via `/metrics`.

## How to use
In order to use this scraper, you can simply run it via docker. Your desired fuel stations can be configured with the environment variable `FUEL_STATIONS`. This matches the last part of the URL for your fuel station website (e.g. for https://classic-oil.de/tankstellen/classic-tankstelle-hamburg/ you need `classic-tankstelle-hamburg`).

If you want multiple fuel stations to be monitored, add them seperated by a space to the env variable.

The refresh time in minutes can be adjusted with the environment variable `REFRESH_TIME`.

The default port for the container is `8080`.

```bash
docker run -d --env "FUEL_STATIONS=classic-tankstelle-hamburg classic-tankstelle-bocholt" --env REFRESH_TIME=10 -p 8080:8080 --name classic-fuel-scraper \
    schneidermaster/classic-fuel-scraper
```

You can configure your Prometheus as follows for it to scrape the container correctly:

```yaml
scrape_configs:
  - job_name: classic-fuel-scraper
    scrape_interval: 1m
    static_configs:
      - targets:
        - 'classic-fuel-scraper:8080'
```