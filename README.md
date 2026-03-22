<div align="center"><a name="readme-top"></a>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo/logo-wide-dark.png">
  <img src="public/logo/logo-wide.png" alt="TaxTicks" width="280">
</picture>

<br>

# TaxTicks — Your Taxes, Simplified.

[![GitHub Stars](https://img.shields.io/github/stars/Shivy410/TaxTicks?color=ffcb47&labelColor=black&style=flat-square)](https://github.com/Shivy410/TaxTicks/stargazers)
[![License](https://img.shields.io/badge/license-MIT-ffcb47?labelColor=black&style=flat-square)](https://github.com/Shivy410/TaxTicks/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/Shivy410/TaxTicks?color=ff80eb&labelColor=black&style=flat-square)](https://github.com/Shivy410/TaxTicks/issues)

</div>

TaxTicks is a self-hosted accounting app designed for freelancers, indie hackers, and small businesses who want to save time and automate expense and income tracking using the power of modern AI.

Upload photos of receipts, invoices, or PDFs, and TaxTicks will automatically recognize and extract all the important data you need for accounting: product names, amounts, items, dates, merchants, taxes, and save it into a structured Excel-like database. You can even create custom fields with your own AI prompts to extract any specific information you need.

The app features automatic currency conversion (including crypto!) based on historical exchange rates from the transaction date. With built-in filtering, multi-project support, import/export capabilities, and custom categories, TaxTicks simplifies reporting and makes tax filing a bit easier.

![Dashboard](public/landing/main-page.webp)

> [!IMPORTANT]
>
> This project is still in early development. Use at your own risk! **Star us** to get notified about new features and bugfixes ⭐️

## ✨ Features

### `1` Analyze photos and invoices with AI

![AI Scanner](public/landing/ai-scanner-big.webp)

Snap a photo of any receipt or upload an invoice PDF, and TaxTicks will automatically recognize, extract, categorize, and store all the information in a structured database.

TaxTicks works with a wide variety of documents, including store receipts, restaurant bills, invoices, bank statements, letters, even handwritten receipts. It handles any language and any currency with ease. Choose from OpenAI, Google Gemini, or Mistral as your AI provider.

### `2` Multi-currency support with automatic conversion (even crypto!)

![Currency Conversion](public/landing/multi-currency.webp)

TaxTicks automatically detects currencies in your documents and converts them to your base currency using historical exchange rates from the actual transaction date. It supports 170+ world currencies and 14 popular cryptocurrencies (BTC, ETH, LTC, DOT, and more).

### `3` Organize your transactions using fully customizable categories, projects and fields

![Transactions Table](public/landing/transactions-big.webp)

Adapt TaxTicks to your unique needs with unlimited customization options. Create custom fields, projects, and categories that better suit your specific needs, industry standards or country. You can create an unlimited number of custom fields to extract more information from your invoices — it's like adding extra columns in Excel.

### `4` Customize any LLM prompt. Even system ones

![Custom LLM](public/landing/custom-llm.webp)

Take full control of how TaxTicks' AI processes your documents. Write custom AI prompts for fields, categories, and projects, or modify the built-in ones to match your specific needs. TaxTicks is 100% adaptable and tunable to your unique requirements — whether you need to extract emails, addresses, project codes, or any other custom information from your documents.

### `5` Flexible data filtering and export

![Data Export](public/landing/export.webp)

Once your documents are processed, easily view, filter, and export your complete transaction history exactly how you need it. Export filtered transactions to CSV with all attached documents included, and generate comprehensive reports for your accountant or tax advisor.

### `6` Self-hosted mode for data privacy

![Self-hosting](docs/screenshots/exported_archive.png)

Keep complete control over your financial data with local storage and self-hosting options. TaxTicks respects your privacy and gives you full ownership of your information. Your financial documents never leave your control.

## 🛳 Deployment and Self-hosting

TaxTicks can be easily self-hosted on your own infrastructure for complete control over your data and application environment. We provide a [Docker image](./Dockerfile) and [Docker Compose](./docker-compose.yml) setup that makes deployment simple:

```bash
curl -O https://raw.githubusercontent.com/Shivy410/TaxTicks/main/docker-compose.yml

docker compose up
```

The Docker Compose setup includes a TaxTicks application container, a PostgreSQL 17 database, automatic database migrations on startup, and volume mounts for persistent data storage.

### Environment Variables

Configure TaxTicks for your specific needs with these environment variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `UPLOAD_PATH` | Yes | Local directory for file uploads and storage | `./data/uploads` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user@localhost:5432/taxticks` |
| `PORT` | No | Port to run the application on | `7331` (default) |
| `BASE_URL` | No | Base URL for the application | `http://localhost:7331` |
| `SELF_HOSTED_MODE` | No | Set to `true` for self-hosting: enables auto-login and custom API keys | `true` |
| `DISABLE_SIGNUP` | No | Disable new user registration on your instance | `false` |
| `BETTER_AUTH_SECRET` | Yes | Secret key for authentication (minimum 16 characters) | `your-secure-random-key` |

You can also configure LLM provider settings in the application or via environment variables:

- **OpenAI**: `OPENAI_MODEL_NAME` and `OPENAI_API_KEY`
- **Google Gemini**: `GOOGLE_MODEL_NAME` and `GOOGLE_API_KEY`
- **Mistral**: `MISTRAL_MODEL_NAME` and `MISTRAL_API_KEY`

## ⌨️ Local Development

We use **Next.js 15+** for the frontend and API, **Prisma** for database models and migrations, and **PostgreSQL** as the database (PostgreSQL 17+ recommended). You will also need **Ghostscript and GraphicsMagick** for PDF processing (install on macOS via `brew install gs graphicsmagick`).

```bash
# Clone the repository
git clone https://github.com/Shivy410/TaxTicks.git
cd TaxTicks

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize the database
npx prisma generate && npx prisma migrate dev

# Start the development server
npm run dev
```

Visit `http://localhost:7331` to see your local TaxTicks instance in action.

## 🤝 Contributing

We welcome contributions to TaxTicks! All development happens on GitHub through issues and pull requests. You can help by filing bug reports, sharing feature ideas, submitting code improvements, or improving documentation.

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ffcb47?labelColor=black&style=for-the-badge)](https://github.com/Shivy410/TaxTicks/pulls)

## 📄 License

TaxTicks is licensed under the [MIT License](LICENSE).
