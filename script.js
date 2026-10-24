const { createApp } = Vue;

createApp({
  data() {
    return {
      // Add your free CoinGecko Demo API key here.
      apiKey: "YOUR_COINGECKO_DEMO_API_KEY",
      coins: [],
      loading: false,
      error: "",
      lastUpdated: "",
      refreshTimer: null
    };
  },

  mounted() {
    this.fetchCoins();
    this.refreshTimer = window.setInterval(this.fetchCoins, 60_000);
  },

  beforeUnmount() {
    window.clearInterval(this.refreshTimer);
  },

  methods: {
    async fetchCoins() {
      if (this.loading) return;

      this.loading = true;
      this.error = "";

      const ids = "bitcoin,ethereum,solana,binancecoin,ripple";
      const endpoint =
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=usd&ids=${ids}` +
        `&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

      const headers = {};
      if (this.apiKey && !this.apiKey.startsWith("YOUR_")) {
        headers["x-cg-demo-api-key"] = this.apiKey;
      }

      try {
        const response = await fetch(endpoint, { headers });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("The API rate limit was reached. Please try again shortly.");
          }
          if (response.status === 401 || response.status === 403) {
            throw new Error("Check your CoinGecko Demo API key in script.js.");
          }
          throw new Error(`The market request failed (${response.status}).`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No market data was returned.");
        }

        this.coins = data;
        this.lastUpdated = new Intl.DateTimeFormat("en", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }).format(new Date());
      } catch (error) {
        this.error = error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      } finally {
        this.loading = false;
      }
    },

    formatPrice(value) {
      if (typeof value !== "number") return "—";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: value < 1 ? 4 : 2,
        maximumFractionDigits: value < 1 ? 6 : 2
      }).format(value);
    },

    formatChange(value) {
      if (typeof value !== "number") return "—";

      const sign = value > 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}% · 24h`;
    },

    chartPoints(prices) {
      if (!Array.isArray(prices) || prices.length < 2) return "";

      const width = 160;
      const height = 42;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = max - min || 1;

      return prices
        .map((price, index) => {
          const x = (index / (prices.length - 1)) * width;
          const y = height - ((price - min) / range) * height;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    }
  }
}).mount("#app");

