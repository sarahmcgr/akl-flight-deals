# Auckland flight deal monitor

Every morning it checks the cheapest return fare from Auckland to every destination over the next 6 months, compares each one to its usual price, and emails you any that are 35%+ cheaper. `dashboard.html` shows everything it found.

## Where it runs

GitHub Actions runs `check.mjs` every day at 18:00 UTC (7am NZ summer time, 6am NZ winter time), saves the price history back to this repository, and publishes the dashboard to GitHub Pages. Your Mac doesn't need to be on. To run it straight away, open the **Actions** tab, choose **Daily flight check**, then **Run workflow**.

Each morning it scans every route using cached prices (Travelpayouts), then re-checks the most promising few live on Google Flights (SerpApi). Only live-confirmed fares count as deals, and Google's typical price range is used as "usual". Without a SerpApi key it falls back to cached prices only.

Keys are never stored in the code:
- **On GitHub:** repository secrets `TRAVELPAYOUTS_TOKEN`, `RESEND_API_KEY`, `EMAIL_TO` and `SERPAPI_KEY` (Settings → Secrets and variables → Actions).
- **On your Mac:** `settings.local.json` (not uploaded), with `travelpayoutsToken`, `resendApiKey`, `emailTo` and `serpApiKey`.

Keys come from your Travelpayouts profile (API token tab) and from https://resend.com (sign up with the address the alerts should go to).

To run a check on your Mac instead: `node check.mjs` (add `--test-email` to re-send the current deals). `./install-daily.sh` sets up a local 7am job; don't run it alongside GitHub, or you'll get duplicate emails.

## Settings (`settings.json`)

- `dealThresholdPercent`: how far below usual a fare must be to count as a deal (default 35).
- `monthsAhead`: how many months of departure dates to search (default 6).
- `includeDomestic`: set to `true` to include NZ domestic routes.
- `liveChecksPerDay`: how many of the day's best cached fares get re-checked live on Google Flights (default 5, which is about 150 SerpApi searches a month).

## Good to know

- "Usual price" starts from rough estimates in `typical-prices.json`. After 5 days of checks for a destination, it switches to the median of prices the monitor has seen itself.
- Prices are cached fares (from the Aviasales data feed) seen in the last 48 hours. The buttons open Google Flights or the airline's own site so you book directly; confirm the price there before you pay.
- You won't get the same deal twice unless it drops a further 5% or two weeks pass.
- Log of each run: `data/monitor.log`.
