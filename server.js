require("dotenv").config();

const path = require("node:path");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const nodemailer = require("nodemailer");

const { buildLeadEmail, validateLead } = require("./src/lead");

const REQUIRED_MAIL_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "LEAD_TO"];

function getMailConfig() {
  const missing = REQUIRED_MAIL_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      ready: false,
      missing
    };
  }

  return {
    ready: true,
    transport: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.MAIL_FROM,
    to: process.env.LEAD_TO
  };
}

function createApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));
  app.use(express.json({ limit: "32kb" }));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  app.get("/health", (req, res) => {
    const mailConfig = getMailConfig();
    res.json({
      ok: true,
      mailReady: mailConfig.ready,
      missingMailEnv: mailConfig.ready ? [] : mailConfig.missing
    });
  });

  app.post(
    "/api/lead",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 8,
      standardHeaders: true,
      legacyHeaders: false,
      message: { ok: false, message: "Слишком много заявок. Попробуйте позже или позвоните мастеру." }
    }),
    async (req, res) => {
      if (req.body.company) {
        return res.status(204).end();
      }

      const validation = validateLead({
        ...req.body,
        ip_address: req.ip,
        user_agent: req.get("user-agent") || req.body.user_agent || ""
      });

      if (!validation.valid) {
        return res.status(400).json({
          ok: false,
          errors: validation.errors
        });
      }

      const mailConfig = getMailConfig();

      if (!mailConfig.ready) {
        console.error("Missing mail environment variables:", mailConfig.missing.join(", "));
        return res.status(500).json({
          ok: false,
          message: "Почта для заявок ещё не настроена. Позвоните мастеру напрямую."
        });
      }

      const transporter = nodemailer.createTransport(mailConfig.transport);
      const email = buildLeadEmail(validation.lead);

      // TODO: сохранять факт получения согласий в постоянное хранилище:
      // дата, время, IP, user-agent, версия текста согласия, источник заявки, UTM и ym_client_id.
      await transporter.sendMail({
        from: mailConfig.from,
        to: mailConfig.to,
        subject: email.subject,
        text: email.text,
        html: email.html
      });

      return res.json({
        ok: true,
        message: "Заявка отправлена"
      });
    }
  );

  app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "index.html"));
  });

  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) {
      return next(error);
    }
    return res.status(500).json({
      ok: false,
      message: "Не удалось отправить заявку. Позвоните мастеру напрямую."
    });
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const app = createApp();
  const mailConfig = getMailConfig();

  if (!mailConfig.ready) {
    console.warn(`Email is not configured. Missing: ${mailConfig.missing.join(", ")}`);
  }

  app.listen(port, () => {
    console.log(`Груз-Сервис landing is running: http://localhost:${port}`);
  });
}

module.exports = {
  createApp,
  getMailConfig
};
