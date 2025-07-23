require("dotenv").config();
const commands = [];
const { API_KEY } = process.env;
require("./global");
require("module-alias/register");
const express = require("express");
const http = require("http");
const ngrok = require("@ngrok/ngrok");
const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");
const morgan = require("morgan");
const FormData = require("form-data");
const moment = require("moment");
const { ImageUploadService } = require("node-upload-images");

//API
const getProducts = () =>
  axios.post(
    `https://end.kaje-store.com/api/service/package_list_otp`,
    {},
    {
      headers: {
        "x-api-token": API_KEY,
      },
    }
  );
  
const cekKuota = (number) =>
  axios.post(
    `https://end.kaje-store.com/api/xl_info/quotas`,
    {
      "seller_id": "",
      number,
    },
    {
      headers: {
        "x-api-token": API_KEY,
      },
    }
  );
const beliPaket = (productId, payment, number) =>
  axios.post(
    `https://end.kaje-store.com/api/service/buy_package_otp`,
    {
      "product_id": productId,
      "payment": payment,
      "number": number,
      "seller_id": ""
    },
    {
      headers: {
        "x-api-token": API_KEY,
      },
    }
  );
const mintaOtp = (number) =>
  axios.post(`https://end.kaje-store.com/api/xl_auth/get_otp`, {
    "number": number,
    "seller_id": ""
  }, {
    headers: {
      "x-api-token": API_KEY
    },
  });
const loginOtp = (number, otp) =>
  axios.post(`https://end.kaje-store.com/api/xl_auth/login_otp`, {
    "seller_id": "",
    "number": number,
    "code_otp": otp
  }, {
    headers: {
      "x-api-token": API_KEY
    }
  });

async function addProduk(number, name, quota, desc) {
  const {data} = await axios.post("https://api.circlecuan.com/api/v1/akrab/otomatis/add", {
    "id_produk": number,
    "nama_paket": name,
    "harga": 0,
    "stok": 4,
    "sisa_slot": 4,
    "jumlah_slot": 4,
    "quota_allocated": parseInt(quota),
    "deskripsi_produk": desc
  }, {
    headers: {
      "x-api-key": "782ef6a6",
      "x-user-id": "147318"
    }
  });
  return data;
}
  
async function listProduk() {
  const {data} = await axios.get("https://api.circlecuan.com/api/v1/akrab/otomatis/all", {
    headers: {
      "x-api-key": "782ef6a6",
      "x-user-id": "147318"
    }
  });
  return data;
}

//FUNCTION
function generateUsername(length){
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let username = ``;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    username += characters[randomIndex];
  };
  return username;
};

const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function hideNumber(text, length) {
  return "*".repeat(length) + text.slice(length);
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
};

let waktu = moment().locale(`id`).utcOffset(7).format(`DD/MM/YYYY`);
let waktu5minutes = moment().locale(`id`).utcOffset(7).add(5, `minutes`).format(`HH:mm:ss`);
  
const logger = require("@utils/logger");
const getDateTime = require("@utils/getDateTime");
const formatCurrency = require("@utils/formatCurrency");
const paginateData = require("@utils/paginateData");

// USERS
let $users = [];
const findUser = async (userId) => {
  return $users.find((user) => user.id == userId || user.username == userId);
};
const saveUsers = async () =>
  fs.writeFile("./database/users.json", JSON.stringify($users));
const updateUser = async (userId, data) => {
  const user = await findUser(userId);
  if (!user) throw new Error(`User ${userId} tidak terdadtar`);
  Object.assign(user, data);
  await saveUsers();
  return data;
};
const deleteUser = async (userId) => {
  const user = await findUser(userId);
  if (!user) throw new Error(`User ${userId} tidak terdaftar`);
  $users.splice($users.indexOf(user), 1);
  return userId;
};

//PRODUCTS
let $products = [];
const findProduct = async (productId) => {
  return $products.find(
    (product) => product.id === productId || product.code === productId
  );
};
const saveProducts = () =>
  fs.writeFile("./database/products.json", JSON.stringify($products));
const updateProduct = async (productId, data) => {
  const product = await findProduct(productId);
  if (!product)
    throw new Error(`Product dengan id ${productId} tidak terdadtar`);
  Object.assign(product, data);
  await saveProducts();
  return data;
};
const deleteProduct = async (productId) => {
  const product = await findProduct(productId);
  if (!product)
    throw new Error(`Product dengan id ${productId} tidak terdadtar`);
  $products.splice($products.indexOf(product), 1);
  return productId;
};

//TRANSACTIONS
let $transaction = [];
const findTransaction = async (transactionId) => {
  return $transaction.find(
    (transaction) =>
      transaction.id == transactionId || transaction.username == transactionId
  );
};
const saveTransaction = async () =>
  fs.writeFile("./database/transaction.json", JSON.stringify($transaction));

//BOT
const telebot = axios.create({
  baseURL: `https://api.telegram.org/bot${process.env.BOT_TOKEN}`,
  family: 4,
});

const bot = {
  setWebhook: async (url) => {
    try {
      const { data } = await telebot.post(`/setWebhook`, {
        url,
      });
      logger("primary", "SET WEBHOOK", data.description);
    } catch (err) {
      logger("error", "SET WEBHOOK", err);
      process.send("restart");
    }
  },
  sendMessage: async (
    chatId,
    { text, replyToMessageId = "", parseMode = "Markdown", buttons = [] }
  ) => {
    try {
      const { data } = await telebot.post(`/sendMessage`, {
        chat_id: chatId,
        reply_to_message_id: replyToMessageId,
        text,
        parse_mode: parseMode,
        reply_markup: JSON.stringify({
          inline_keyboard: [...buttons],
        }),
      });
      logger("primary", "sendMessage", data.result.from.id);
    } catch (err) {
      console.log(err);
      logger("error", "sendMessage", err.message);
    }
  },
  deleteMessage: async (
    chatId,
    msgId,
  ) => {
    try {
      const { data } = await telebot.post(`/deleteMessage`, {
        chat_id: chatId,
        message_id: msgId
      });
      logger("primary", "deleteMessage", data)
    } catch (err) {
      console.log(err);
      logger("error", "deleteMessage", err.message);
    }
  },
  editMessageText: async (
    chatId,
    msgId,
    { text, replyToMessageId = "", parseMode = "Markdown", buttons = [] }
  ) => {
    try {
      const { data } = await telebot.post(`/editMessageText`, {
        chat_id: chatId,
        message_id: msgId,
        reply_to_message_id: replyToMessageId,
        text,
        parse_mode: parseMode,
        reply_markup: JSON.stringify({
          inline_keyboard: [...buttons],
        }),
      });
      logger("primary", "sendMessage", data.result.from.id);
    } catch (err) {
      console.log(err);
      logger("error", "sendMessage", err.message);
    }
  },
  sendAudio: async (
    chatId,
    {
      audio,
      caption = "",
      replyToMessageId = "",
      parseMode = "Markdown",
      buttons = [],
    }
  ) => {
    try {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("reply_to_message_id", replyToMessageId);
      form.append("audio", fs.createReadStream(audio));
      form.append("caption", caption);
      form.append("parse_mode", parseMode);
      form.append(
        "reply_markup",
        JSON.stringify({
          inline_keyboard: [...buttons],
        })
      );
      const { data } = await telebot.post(`sendAudio`, form, {
        headees: {
          ...form.getBoundary(),
        },
      });
      logger("primary", "sendAudio", data.result.from.id);
    } catch (err) {
      console.log(err);
      logger("error", "sendAudio", err.message);
    }
  },
  sendVideo: async (
    chatId,
    {
      video,
      caption = "",
      replyToMessageId = "",
      parseMode = "Markdown",
      buttons = [],
    }
  ) => {
    try {
      const { data } = await telebot.post(`/sendVideo`, {
        chat_id: chatId,
        reply_to_message_id: replyToMessageId,
        video,
        caption: caption,
        parse_mode: parseMode,
        reply_markup: JSON.stringify({
          inline_keyboard: [...buttons],
        })
      });
      logger("primary", "sendVideo", data.result.from.id);
    } catch (err) {
      console.log(err);
      logger("error", "sendVideo", err.message);
    }
  },
  sendPhoto: async (
    chatId,
    {
      photo,
      caption = "",
      replyToMessageId = "",
      parseMode = "Markdown",
      buttons = [],
    }
  ) => {
    try {
      const { data } = await telebot.post(`/sendPhoto`, {
        chat_id: chatId,
        reply_to_message_id: replyToMessageId,
        photo,
        caption: caption,
        reply_markup: JSON.stringify({
          inline_keyboard: [...buttons],
        })
      });
      logger("primary", "sendPhoto", data.result.from.id);
    } catch (err) {
      console.log(err);
      logger("error", "sendPhoto", err.message);
    }
  },
  getFile: async (fileId) => {
    try {
      const form = new FormData();
      form.append("file_id", fileId);
      const { data } = await telebot.post(`/getFile`, form, {
        headers: { ...form.getBoundary() },
      });
      console.log(data);
    } catch (err) {
      console.log(err);
      logger("error", "getFile", err.message);
    }
  },
  sendSticker: async (chatId, { sticker, replyToMessageId = "" }) => {
    try {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("sticker", fs.createReadStream(sticker));
      form.append("reply_to_message_id", replyToMessageId);
      const { data } = await telebot.post(`/sendSticker`, form, {
        headers: { ...form.getBoundary() },
      });
      logger("primary", "sendSticker", data.result.from.id);
    } catch (err) {
      console.log(err);
      logger("error", "sendSticker", err.message);
    }
  },
  setMessageReaction: async (chatId, messageId, emoji) => {
    try {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("message_id", messageId);
      form.append(
        "reaction",
        JSON.stringify([
          {
            type: "emoji",
            emoji,
          },
        ])
      );
      await telebot.post(`/setMessageReaction`, form, {
        headers: { ...form.getBoundary() },
      });
      logger("primary", "setReaction", chatId);
    } catch (err) {
      console.log(err);
      logger("error", "setReaction", err.message);
    }
  },
};

const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.post("/", async (req, res) => {
  res.status(200).end();

  const { message, callback_query } = req.body;
  const m = new Object({});
  if (message) {
    m.message = message;
    m.messageId = message.message_id;
    m.chatId = message.chat.id;
    m.isGroup = message.chat.id.toString().startsWith("-");
    m.type = message.photo
      ? "photo"
      : message.video
      ? "video"
      : message.video_note
      ? "video_note"
      : message.voice
      ? "voice"
      : message.location
      ? "location"
      : message.poll
      ? "pool"
      : message.contact
      ? "contact"
      : message.sticker
      ? "sticker"
      : message.reply_to_message
      ? "quoted"
      : message.audio
      ? "audio"
      : message.sticker
      ? "sticker"
      : "";
    m.quoted = message.reply_to_message;
    m.text =
      m.type === "photo"
        ? message.caption || ""
        : m.type === "video"
        ? message.caption || ""
        : m.type === "replyToMessage"
        ? message.text || ""
        : message.text || "";
    m.userId = message.from.id;
    m.firstName = message.from.first_name;
    m.userName = message.from.username;
    m.isOwner = global.owner.id === m.userId;
    m.isCmd = m.text.startsWith("/");
    m.cmd = m.text?.trim().split(" ")[0].replace("/", "").toLowerCase();
    m.args = m.text
      ?.replace(/^\S*\b/g, "")
      .trim()
      .split(global.splitArgs)
      .filter((arg) => arg !== "");
  }
  if (callback_query) {
    const { message } = callback_query;
    m.message = message;
    m.messageId = message.message_id;
    m.chatId = message.chat.id;
    m.isGroup = message.chat.id.toString().startsWith("-");
    m.type = message.photo
      ? "photo"
      : message.video
      ? "video"
      : message.video_note
      ? "video_note"
      : message.voice
      ? "voice"
      : message.location
      ? "location"
      : message.poll
      ? "pool"
      : message.contact
      ? "contact"
      : message.sticker
      ? "sticker"
      : message.reply_to_message
      ? "quoted"
      : message.audio
      ? "audio"
      : message.sticker
      ? "sticker"
      : "";
    m.quoted = message.reply_to_message;
    m.text =
      m.type === "photo"
        ? message.caption || ""
        : m.type === "video"
        ? message.caption || ""
        : m.type === "replyToMessage"
        ? message.text || ""
        : message.text || "";
    m.userId = callback_query.from.id;
    m.firstName = callback_query.from.first_name;
    m.userName = callback_query.from.username;
    m.isOwner = global.owner.id === m.userId;
    m.isCmd = callback_query.data.startsWith("/");
    m.cmd = callback_query.data
      .trim()
      .split(" ")[0]
      .replace("/", "")
      .toLowerCase();
    m.args = callback_query.data
      .replace(/^\S*\b/g, "")
      .trim()
      .split(global.splitArgs)
      .filter((arg) => arg !== "");
  }

  m.reply = (text, buttons = [], parseMode = "MarkdownV2") =>
    bot.sendMessage(m.chatId, {
      text: text?.replace(/([_~`>#+\-=|{}.!\\])/g, "\\$&"),
      buttons,
      parseMode,
      replyToMessageId: m.messageId,
    });
  
  m.image = (image, text) =>
    bot.sendPhoto(m.chatId, {
      photo: image,
      caption: text,
      replyToMessageId: m.messageId,
    });
  m.replyCmd = (text, buttons, parseMode = "MarkdownV2") =>
    m.reply(
      `*${global.name} | ${m.cmd}*\n\n${text}\n\n${getDateTime()}`,
      buttons,
      parseMode
    );
  m.replyReact = (emoji) =>
    bot.setMessageReaction(m.chatId, m.messageId, emoji);
  m.replySticker = (sticker) =>
    bot.sendSticker(m.chatId, { sticker, replyToMessageId: m.messageId });

  let user = await findUser(m.userId);
  if (!user) {
    user = {
      id: m.userId,
      name: m.firstName,
      username: m.userName,
      saldo: 0,
      role: "reseller",
      historysOTP: [],
      historysAKRAB: []
    };
    $users.push(user);
    await saveUsers();
  }
  console.log(m);

  const hasCmd = commands.find((cmd) => cmd.id === m.userId && cmd.identifier);
  
  if (hasCmd && !m.isCmd) {
    
    //COMMAND ADD SALDO
    if (hasCmd.identifier === "addsaldo") {
      if (!hasCmd.args[0]) {
        const user = await findUser(m.text);
        if (!user) return m.reply(`User ${m.text} tidak terdaftar.`);
        hasCmd.args[0] = m.text;
        return m.reply(`Masukkan jumlah atau nominal saldo yang ingin ditambahkan:`);
      } else if (!hasCmd.args[1]) {
        if (isNaN(m.text)) return m.reply(`Nominal harus berupa angka: `);
        const res = await updateUser(hasCmd.args[0], {
          saldo: (await findUser(hasCmd.args[0])).saldo + parseInt(m.text),
        });
        commands.splice(commands.indexOf(hasCmd), 1);
        return m.reply(`Done, saldo saat ini untuk ${hasCmd.args[0]} adalah ${formatCurrency(res.saldo)}`);
      }
    };
    
    //COMMAND MIN SALDO
    if (hasCmd.identifier === "minsaldo") {
      if (!hasCmd.args[0]) {
        const user = await findUser(m.text);
        if (!user) return m.reply(`User ${m.text} tidak terdaftar.`);
        hasCmd.args[0] = m.text;
        return m.reply(`Masukkan jumlah atau nominal saldo yang ingin dikurangi:`);
      } else if (!hasCmd.args[1]) {
        if (isNaN(m.text)) return m.reply(`Nominal harus berupa angka:`);
        const res = await updateUser(hasCmd.args[0], {
          saldo: (await findUser(hasCmd.args[0])).saldo - parseInt(m.text),
        });
        commands.splice(commands.indexOf(hasCmd), 1);
        return m.reply(`Done, saldo saat ini untuk ${hasCmd.args[0]} adalah ${formatCurrency(res.saldo)}`);
      }
    };
    
    //COMMAND EDIT HARGA
    if (hasCmd.identifier === "editharga") {
      if (!hasCmd.args[0]) {
        const product = await findProduct(m.text);
        if (!product) return m.reply(`Produk dengan id ${m.text} tidak terdaftar.`);
        hasCmd.args[0] = m.text;
        return m.reply(`Masukkan nominal harga baru untuk produk ${product.name}`);
      } else if (!hasCmd.args[1]) {
        if (isNaN(m.text)) return m.reply(`Nominal harga harus berupa angka`);
        const updatedProduct = await updateProduct(hasCmd.args[0], {
          fee: parseInt(m.text),
        });
        commands.splice(commands.indexOf(hasCmd), 1);
        return m.reply(`Harga produk telah diperbaharui menjadi ${formatCurrency(updatedProduct.fee)}`);
      }
    };
    
    //HAPUS PRODUK
    if (hasCmd.identifier === "hapusproduk") {
      if (!hasCmd.args[0]) {
        const product = await findProduct(m.text);
        if (!product) return m.reply(`Produk dengan id ${m.text} tidak terdaftar.`);
        hasCmd.args[0] = m.text;
        await deleteProduct(product.id);
        await m.reply(`Produk ${product.name} telah dihapus dari database.`);
        commands.splice(commands.indexOf(hasCmd), 1);
      }
    };
    
    //COMMAND LOGIN OTP
    if (hasCmd.identifier === "mintaotp") {
      if (!hasCmd.args[0]) {
        if (isNaN(m.text)) return m.reply(`Nomor harus berupa angka:`);
        hasCmd.args[0] = m.text;
        mintaOtp(m.text)
          .then((res) => {
            const { success, message, data } = res.data;
            if (success) return m.reply(`${message}\n\nSilahkan masukkan kode OTP anda:`)
          })
          .catch((err) => console.log(err))
      } else if (!hasCmd.args[1]) {
        if (isNaN(m.text)) return m.reply(`Kode OTP harus berupa angka:`);
        commands.splice(commands.indexOf(hasCmd), 1);
        loginOtp(hasCmd.args[0], m.text)
          .then((res) => {
            const { success, message, data } = res.data;
            if (success) return m.reply(`Login OTP berhasil`);
          })
          .catch((err) => console.log(err))
      }
    };
    
    //BELI PAKET
    if (hasCmd.identifier === "belipaket") {
      if (!hasCmd.args[0]) {
        const product = await findProduct(m.text);
        if (!product) return m.reply(`Produk dengan ID ${m.text} tidak terdaftar.`);
        hasCmd.args[0] = m.text;
        return m.reply(`Masukkan metode pembayaran:`);
      } else if (!hasCmd.args[1]) {
        return m.reply(`Nomor anda:`);
      } else if (!hasCmd.args[2]) {
        const product = await findProduct(hasCmd.args[0]);
        const user = await findUser(m.userId);
        if (user.saldo - product.fee <= 0) return m.reply(`Saldo anda kurang dari ${formatCurrency(product.fee)}.\n\nSaldo anda saat ini adalah ${formatCurrency(user.saldo)}`);
        if (isNaN(m.text)) return m.reply(`Pastikan nomor anda sudah benar`);
        beliPaket(hasCmd.args[0], hasCmd.args[1], m.text)
          .then(async (res) => {
            const { success, message, data } = res.data;
            if (!success) return m.reply(`Gagal melakukan transaksi\n\n${message}`);
            const trx = data.transaction_data;
            const saldoAwal = user.saldo;
            user.saldo = saldoAwal - product.fee;
            if (hasCmd.args[1] === "QRIS") {
              const base64String = trx.trx_deeplink;
              const buffer = Buffer.from(base64String.split(`,`)[1], `base64`);
              console.log(buffer.toString(`binary`));
              fs.writeFile("./qr.png", buffer.toString(`binary`))
            } else {
            m.reply(`*TRANSAKSI SUKSES*
            
*PRODUK:* ${trx.product_name}
*ID:* ${trx.trx_unix}
*KATEGORI:* ${trx.product_category}
*PAYMENT:* ${trx.trx_payment}
*LINK:* ${trx.trx_deeplink}`);
            }
            const transaksi = {
              id: trx.trx_unix,
              product: trx.product_name,
              category: trx.product_category,
              payment: trx.trx_payment,
              number: m.text
            };
            user.historysOTP.push(transaksi);
            fs.writeFile("./database/users.json", JSON.stringify($users));
          })
          .catch((err) => console.log(err))
      }
    };
    
    //COMMAND BROADCAST
    if (hasCmd.identifier === "broadcast") {
      if (!hasCmd.args[0]) {
        hasCmd.args[0] = m.text;
        for (const data of $users) {
          await bot.sendMessage(data.id, {
            text: `📍 *INFORMASI* 📍\n\n*${m.text}*`,
            buttons: [
                [
                  {
                    text: "WhatsApp",
                    url: "https://wa.me/6287760204418"
                  }
                ],
                [
                  {
                    text: "Telegram",
                    url: "https://t.me/WuzzSTORE"
                  }
                ],
              ],
            parseMode: "Markdown",
          });
        };
      };
    };
    
    //COMMAND TOP UP
    if (hasCmd.identifier === "topup") {
      if (!hasCmd.args[0]) {
        if (isNaN(m.text)) return m.reply(`Masukkan jumlah Top Up:`);
        hasCmd.args[0] = m.text;
        const nominal = parseInt(m.text) + generateRandomNumber(100, 250);
        const config = {
          merchantId: process.env.MERCHANT,
          apiKey: process.env.KEY_ORKUT,
          baseQrString: process.env.CODE_QR,
        };
        const response = await axios.get(`https://wuzzstore.cloud/api/orkut/createpayment?apikey=${process.env.API_KEY_ORKUT}&amount=${nominal}&codeqr=${process.env.CODE_QR}`);
        const result = response.data.result;
        try {
          const text = `DETAIL TOP OP
          
ID     : WZ${new Date()}
JUMLAH : ${formatCurrency(result.amount)}
TIMEOUT: 5 Menit

NOTE: SCAN QRIS SEBELUM JAM ${waktu5minutes} WIB`;
          await m.image(result.qrImageUrl, text);
          let transaction = false;
          const timer = setTimeout(async() => {
            if (!transaction) {
              m.reply(`Transaksi anda dibatalkan karena melewati batas waktu.`);
            }
          }, 5 * 60 * 1000);
          while(!transaction) {
            try {
              const { data } = await axios.get("https://wuzzstore.cloud/api/orkut/cekstatus?apikey=wuzznurul&username=sutiknocell&token=1370599:X8fCoUw5ypSgFQjqB27NPcDIVv4GJiZK");
              if (result.amount === data.results[0].jumlah.replace(".", "")) {
                transaction = true;
                clearTimeout(timer);
                const saldoAwal = user.saldo;
                user.saldo = saldoAwal + parseInt(result.amount);
                await saveUsers();
                m.reply(`TOP UP BERHASIL
                
SALDO   : ${formatCurrency(saldoAwal)}
TOP UP  : ${formatCurrency(parseInt(result.amount))}
SAAT INI: ${formatCurrency(user.saldo)}

TERIMAKASIH`);
              }
            } catch (err) {
              console.log(err);
            }
            if (!transaction) {
              await new Promise(resolve => setTimeout(resolve, 1000 * 5));
            };
          };
        } catch (err) {
          console.log(err);
        }
      }
    };
    //COMMAND ADD AKRAB
    if (hasCmd.identifier === "addakrab") {
      if (!hasCmd.args[0]) {
        return m.reply(`Masukkan ID produk:`);
        hasCmd.args[0] = m.text;
      } else if (!hasCmd.args[1]) {
        if (isNaN(m.text)) return m.reply(`Masukkan nomor pengelola:`);
        const varian = $akrab.find((p) => p.name === hasCmd.args[0]);
        const res = await addProduk(m.text, varian.name, varian.quota, varian.desc);
        m.reply(`${res.message}\n\n${res.id}`)
      }
    };
  };
  
  if (m.isCmd) {
    if (!hasCmd) {
      commands.push({
        id: m.userId,
        identifier: m.cmd,
        args: m.args,
      });
    } else {
      hasCmd.identifier = m.cmd;
      hasCmd.args = m.args;
    }
  }
  
  switch (m.cmd) {
    case "start":
      try {
        if (!m.isOwner) {
          await m.reply(`Hai, ${user.name} 👋🏻\n\nSelamat datang di ${global.name}\n\n*NAMA:* ${user.name}\n*USERNAME:* ${user.username}\n*ID:* ${user.id}*\n\n*Transaksi OTP:* ${user.historysOTP.length}x\n*• Total User Bot: ${$users.length} Orang*`,
            [
              [
                {
                  text: "🗂 Produk OTP",
                  callback_data: "/produkotp",
                },
              ],
              [
                {
                  text: "🗂 Produk Akrab",
                  callback_data: "/produkakrab",
                },
              ],
              [
                {
                  text: "📥 Login OTP",
                  callback_data: "/mintaotp",
                },
                {
                  text: "🛍 Riwayat",
                  callback_data: "/riwayat",
                },
              ],
              [
                {
                  text: "💵 Top Up",
                  callback_data: "/topup"
                }
              ],
            ]
          );
        } else {
          await m.reply(
            `*${global.name}*\n*Selamat datang* 👋\n*ID:* ${user.id}\n*Nama:* ${
              user.name
            }\n*Username:* ${user.username}\n*Saldo:* ${formatCurrency(
              user.saldo
            )}\n*Role:* ${user.role}\n*Transaksi OTP:* ${user.historysOTP.length}\n*Transaksi Akrab:* ${user.historysAKRAB.length}\n\nJumlah user: ${$users.length} Pengguna`,
            [
              [
                {
                  text: "🗂 Produk OTP",
                  callback_data: "/produkotp",
                },
              ],
              [
                {
                  text: "🗂 Produk Akrab",
                  callback_data: "/produkakrab",
                },
              ],
              [
                {
                  text: "📥 Login OTP",
                  callback_data: "/mintaotp",
                },
                {
                  text: "🛍 Riwayat",
                  callback_data: "/riwayat",
                },
              ],
              [
                {
                  text: "💵 Top Up",
                  callback_data: "/topup",
                },
              ],
              [
                {
                  text: "📥 Tambah Stok Akrab",
                  callback_data: "/pilihproduk",
                },
              ],
              [
                {
                  text: "➕ Add Saldo",
                  callback_data: "/addsaldo",
                },
                {
                  text: "➖ Min Saldo",
                  callback_data: "/minsaldo",
                },
              ],
              [
                {
                  text: "🧑‍🧒‍🧒 List User",
                  callback_data: "/listuser",
                },
              ],
              [
                {
                  text: "🛄 Get Product",
                  callback_data: "/getproduct",
                },
              ],
            ]
          );
        }
      } catch (err) {
        console.log(err);
      }
    break;
    //
    /**
     * MENU ADMIN
    **/
    //
    //ADD SALDO
    case "addsaldo":
      try {
        if (!m.isOwner) return m.reply(`Fitur khusus admin`);
        if (!m.args[0]) return m.reply(`Input username:`);
        if (isNaN(m.args[1])) return m.reply(`Masukkan jumlah atau nominal saldo yang ingin ditambahkan:`);
        const user = findUser(m.args[0]);
        if (!user) return m.reply(`User ${m.args[0]} tidak terdaftar.`);
        const updatedUser = await updateUser(m.args[0], {
          saldo: (await findUser(m.args[0])).saldo + parseInt(m.args[1]),
        });
        return m.reply(`Done, saldo saat ini untuk user @${m.args[0]} adalah ${formatCurrency(updatedUser.saldo)}`);
      } catch (err) {
        console.log(err);
      }
    break;
    //MIN SALDO
    case "minsaldo":
      try {
        if (!m.isOwner) return m.reply(`Fitur khusus admin`);
        if (!m.args[0]) return m.reply(`Input username:`);
        if (isNaN(m.args[1])) return m.reply(`Masukkan jumlah atau nominal saldo yang ingin dikurangi:`);
        const user = findUser(m.args[0]);
        if (!user) return m.reply(`User ${m.args[0]} tidak terdaftar.`);
        const updatedUser = await updateUser(m.args[0], {
          saldo: (await findUser(m.args[0])).saldo - parseInt(m.args[1]),
        });
        return m.reply(`Done, saldo saat ini untuk user @${m.args[0]} adalah ${formatCurrency(updatedUser.saldo)}`);
      } catch (err) {
        console.log(err);
      }
    break;
    //GET PRODUCT
    case "getproduct":
      if (!m.isOwner) return;
      getProducts()
      .then(async (res) => {
        const { success, message, data } = res.data;
        if (!success) return m.reply(`Terjadi kesalahan\n\n${message}`);
        console.log(data)
        const products = data.map((p) => {
          return {
            id: p.product_id,
            name: p.product_name,
            desc: p.product_desc,
            category: p.product_category,
            payment: p.package_payment,
            price: p.payment_any,
            fee: p.service_fee
          };
        });
        $products = products;
        await saveProducts();
        m.reply(`Done. ${$products.length} produk telah ditambahkan.`);
      })
      .catch((err) => console.log(err))
    break;
    //EDIT HARGA
    case "editharga":
      try {
        if (!m.isOwner) return m.reply(`Fitur khusus admin.`);
        if (!m.args[0]) return m.reply(`Masukkan id produk:`)
        const product = await findProduct(m.args[0]);
        if (!product) return m.reply(`Produk dengan id ${m.args[0]} tidak terdaftar.`);
        if (isNaN(m.args[1])) return m.reply(`Masukkan nominal harga berupa angka:`);
        const updatedProduct = await updateProduct(m.args[0], {
          fee: parseInt(m.args[1]),
        });
        await m.reply(`Harga produk ${product.name} telah diperbaharui menjadi ${formatCurrency(updatedProduct.fee)}`);
      } catch (err) {
        console.log(err);
      }
    break;
    //HAPUS PRODUK
    case "hapusproduk":
      try {
        if (!m.isOwner) return m.reply(`Fitur khusus admin`);
        if (!m.args[0]) return m.reply(`Masukkan produk id:`);
        const product = await findProduct(m.args[0]);
        if (!product) return m.reply(`Produk dengan id ${m.args[0]} tidak terdaftar.`);
        await deleteProduct(product.id);
        return m.reply(`Produk ${product.name} telah dihapus dari database.`);
      } catch (err) {
        console.log(err);
      }
    break;
    //LIST USER
    case "listuser":
      try {
        if (!m.isOwner) return;
        const page = parseInt(m.args[0]) || 1;
        const paginatedData = await paginateData($users, page, 5);
        const btn = [];
        if (page > 1 && page - 1 >= 1) {
          btn.push([
            {
              text: `Prev`,
              callback_data: `/listusers ${page - 1}`,
            },
          ]);
        }
        if (
          page < paginatedData.totalPages &&
          page + 1 <= paginatedData.totalPages
        ) {
          btn.push([
            {
              text: `Next`,
              callback_data: `/listusers ${page + 1}`,
            },
          ]);
        }
        if (paginatedData.data.length < 1) {
          return m.reply(`*Tidak ada data yang akan ditampilkan*`);
        }

        const btnOfData = paginatedData.data.map((user, index) => {
          return [
            [
              {
                text: `Add Saldo ${index + 1}. ${user.name}`,
                callback_data: `/addsaldo ${user.username}`,
              },
              {
                text: `Min Saldo ${index + 1}. ${user.name}`,
                callback_data: `/minsaldo ${user.username}`,
              },
            ],
            [
              {
                text: `Delete ${index + 1}. ${user.name}`,
                callback_data: `/deleteuser ${user.username}`,
              },
            ],
          ];
        });

        btn.push(...btnOfData);

        if (callback_query && m.args.length > 0) {
          bot.editMessageText(m.chatId, m.messageId, {
            text: `*JUMLAH USER:* ${$users.length}

${paginatedData.data
  .map((x, index) => {
    return `*${index + 1}. ${x.name}*\n- *ID:* ${x.id}\n- *Username:* ${
      x.username
    }\n- *Saldo:* ${formatCurrency(x.saldo)}\n- *Jumlah Trx:* ${x.historysOTP.length}`;
  })
  .join("\n\n")}`,
            buttons: btn.flat(1),
          });
        } else
          m.reply(
            `*JUMLAH USER:* ${$users.length}

${paginatedData.data
  .map((x, index) => {
    return `*${index + 1}. ${x.name}*\n- *ID:* ${x.id}\n- *Username:* ${
      x.username
    }\n- *Saldo:* ${formatCurrency(x.saldo)}\n- *Jumlah Trx:* ${x.historysOTP.length}`;
  })
  .join("\n\n")}`,
            btn.flat(1)
          );
      } catch (err) {
        console.log(err);
      }
    break;
    //BROADCAST
    case "broadcast":
      try {
        if (!m.isOwner) return m.reply(`Fitur khusus admin`);
        if (!m.args[0]) return m.reply(`Masukkan pesan yang ingin disampaikan:`);
      } catch (err) {
        console.log(err);
      }
    break;
    //ADD AKRAB
    case "pilihproduk":
      try {
        if (!m.isOwner) return;
        if (!m.args[0]) return m.reply(`Pilih produk yang ingin ditambahkan`, [
            [
              {
                text: "JUMBO",
                callback_data: "/addakrab JUMBO"
              },
              {
                text: "LITE",
                callback_data: "/addakrab LITE"
              },
            ],
            [
              {
                text: "BIG",
                callback_data: "/addakrab BIG"
              },
              {
                text: "MINI",
                callback_data: "/addakrab MINI"
              },
            ],
            [
              {
                text: "L",
                callback_data: "/addakrab L"
              },
              {
                text: "SMALL",
                callback_data: "/addakrab SMALL"
              },
            ],
          ]);
      } catch (err) {
        console.log(err)
      }
    break;
    case "addakrab":
      try {
        if (!m.args[1]) return m.reply(`Masukkan nomor pengelola:`);
      } catch (err) {
        console.log(err)
      }
    break;
    //
    /**
     * MENU RESELLER
    **/
    //
    //PRODUK OTP
    case "produkotp":
      try {
        const page = parseInt(m.args[0]) || 1;
        const paginatedData = await paginateData($products, page, 5);
        const btn = paginatedData.data.map((x) => {
          return [
            {
              text: `${x.name} ${formatCurrency(x.fee)}`,
              callback_data: `/detailproduk ${x.id}`,
            },
          ];
        });
        if (page > 1 && page - 1 >= 1) {
          btn.push([
            {
              text: `Prev`,
              callback_data: `/produkotp ${page - 1}`,
            },
          ]);
        }
        if (
          page < paginatedData.totalPages &&
          page + 1 <= paginatedData.totalPages
        ) {
          btn.push([
            {
              text: `Next`,
              callback_data: `/produkotp ${page + 1}`,
            },
          ]);
        }
        if (paginatedData.data.length < 1) {
          return m.reply(`*Tidak ada data yang akan ditampilkan*`);
        }
        if (m.isOwner) {
          const btnOfData = paginatedData.data.map((x) => {
            return [
              {
                text: `Edit ${x.name}`,
                callback_data: `/editharga ${x.id}`,
              },
              {
                text: `Hapus ${x.name}`,
                callback_data: `/hapusproduk ${x.id}`,
              },
            ];
          });

          btn.push(...btnOfData);
        }

        if (callback_query && m.args.length > 0) {
          return bot.editMessageText(m.chatId, m.messageId, {
            text: `*Total: ${$products.length} Produk*`,
            buttons: btn,
          });
        } else
          m.reply(
            `*Total: ${$products.length} Produk*`,
            btn
          );
      } catch (err) {
        console.log(err);
      }
    break;
    //DETAIL PRODUK
    case "detailproduk":
      try {
        if (!m.args[0]) return m.reply(`ID Produk kosong.`);
        const product = await findProduct(m.args[0]);
        const pay = product.payment.map((p) => {
          return {
            payment: p
          }
        });
        const btn = pay.map((p) => {
          return [
            {
              text: p.payment,
              callback_data: `/belipaket ${m.args[0]}|${p.payment}`
            }
          ]
        });
        btn.push([
          {
            text: "Kembali",
            callback_data: "/produkotp",
          }
        ]);
        await m.reply(`*Paket:* ${product.name}\n*Kategori:* ${product.category}\n*Pulsa/E-Wallet:* ${formatCurrency(product.price)}\n*Fee:* ${formatCurrency(product.fee)}\n*Deskripsi:* ${product.desc.join("\n")}`, btn)
      } catch (err) {
        console.log(err);
      }
    break;
    //BELI PAKET
    case "belipaket":
      try {
        if (!m.args[0]) return m.reply(`Masukkan ID produk:`);
        const product = await findProduct(m.args[0]);
        if (!product) return m.reply(`Produk dengan ID ${m.args[0]} tidak terdaftar`);
        if (!m.args[1]) return m.reply(`Masukkan metode pembayaran:`);
        if (isNaN(m.args[2])) return m.reply(`Masukkan nomor hp anda:`);
        beliPaket(m.args[0], m.args[1], m.args[2])
          .then((res) => {
            const { success, message, data } = res.data;
            if (!success) return m.reply(`Gagal melakulan transaksi\n\n${message}`);
            const trx = data.transaction_data;
            return m.reply(`*TRANSAKSI SUKSES*
            
*PRODUK:* ${trx.product_name}
*ID:* ${trx.trx_unix}
*KATEGORI:* ${trx.product_category}
*PAYMENT:* ${trx.trx_payment}
*LINK:* ${trx.trx_deeplink}`);
          })
          .catch((err) => console.log(err))
      } catch (err) {
        console.log(err);
      }
    break;
    //MINTA OTP
    case "mintaotp":
      try {
        if (isNaN(m.args[0])) return m.reply(`Masukkan nomor hp anda:`);
        mintaOtp(m.args[0])
          .then((res) => {
            const { success, message, data } = res.data;
            console.log(data)
          })
          .catch((err) => console.log(data));
        if (isNaN(m.args[1])) return m.reply(`Masukkan kode otp:`)
      } catch (err) {
        console.log(err);
      }
    break;
    //PRODUK AKRAB
    case "produkakrab":
      try {
        const res = await listProduk();
        const respon = res.data.map((p) => {
          return {
            id: p.id,
            name: p.nama_paket,
            stok: p.sisa_slot
          }
        });
        const btn = respon.map((p) => {
          return [
            {
              text: `${p.name} (${p.id}) = ${p.stok}`,
              callback_data: `/beliakrab ${p.id}`
            }
          ]
        });
        await m.reply(`Jumlah Produk: ${respon.length}`, btn);
      } catch (err) {
        console.log(err);
      }
    break;
    //RIWAYAT
    case "riwayat":
      try {
        const user = await findUser(m.userId);
        m.reply(`*Jumlah Transaksi OTP:* ${user.historysOTP.length}\n*Jumlah Transaksi Akrab:* ${user.historysAKRAB.length}`, [
          [
            {
              text: "Riwayat Transaksi OTP",
              callback_data: "/trxotp",
            },
          ],
          [
            {
              text: "Riwayat Transaksi Akrab",
              callback_data: "/trxakrab",
            }
          ],
        ]);
      } catch (err) {
        console.log(err);
      }
    break;
    //TOP UP
    case "topup":
      try {
        if (!m.args[0]) return m.reply(`Masukkan jumlah Top Up:`);
      } catch (err) {
        console.log(err);
      }
    break;
    default:
    break
  }
});

const server = http.createServer(app);
server.listen(global.port, async () => {
  $users = JSON.parse(await fs.readFile("./database/users.json"));
  $transaction = JSON.parse(await fs.readFile("./database/transaction.json"));
  $products = JSON.parse(await fs.readFile("./database/products.json"));
  $akrab = JSON.parse(await fs.readFile("./database/akrab.json"));
  logger("info", "KONEKSI PORT", server.address().port);
  if (global.baseURL) {
    bot.setWebhook(global.baseURL);
  } else {
    ngrok
      .connect({ addr: server.address().port, authtoken_from_env: true })
      .then(async (v) => {
        logger("primary", "KONEKSI URL", `${v.url()}`);
        global.baseURL = v.url();
        bot.setWebhook(v.url());
      });
  }
});