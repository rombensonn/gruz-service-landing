# Груз-Сервис landing

Одностраничный лендинг на HTML/CSS/JS и небольшой backend для получения заявок на email.

## Стек

- Frontend: чистый HTML5, CSS3, минимум JavaScript.
- Backend: Node.js + Express.
- Email: Nodemailer через SMTP.
- Защита формы: серверная валидация, honeypot-поле, rate limit.

Такой стек подходит проекту лучше, чем CMS или тяжёлый фреймворк: лендинг простой, заявок немного, а форму нужно надёжно отправлять на почту без внешних сервисов вроде Formspree.

## Запуск

```bash
npm install
cp .env.example .env
npm start
```

После запуска сайт будет доступен по адресу:

```text
http://localhost:3000
```

## Настройка email

В `.env` нужно указать SMTP-данные почтового ящика, с которого сервер будет отправлять заявки:

```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=site@example.ru
SMTP_PASS=app-password-here
MAIL_FROM="Груз-Сервис сайт <site@example.ru>"
LEAD_TO=manager@example.ru
```

Для Яндекс 360, Mail.ru и Gmail обычно нужен пароль приложения. Обычный пароль от почтового аккаунта часто не подойдёт.

## Проверка

```bash
npm test
```

Проверка статуса сервера:

```bash
curl http://localhost:3000/health
```

Если `mailReady` равен `false`, значит в `.env` не хватает SMTP-параметров.
