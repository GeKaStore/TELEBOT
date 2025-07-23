global.baseURL = ""; /// Default domain, Jika ingin menggunakan domain sendiri maka set webhook ke domain ini.. Ngrok tidak dijalankan
global.port = 0; // Server port
global.name = "WUZZSTORE"; // Bot Name
global.locale = "id"; /// Locale
global.timezone = "Asia/Jakarta"; /// WIB
/// global.timezone = "Asia/Jayapura"; /// WIT
/// global.timezone = "Asia/Makassar"; /// WITA

global.splitArgs = "|"; /// Default split arguments

global.moment = require("moment-timezone");
global.moment.locale(global.locale);

global.owner = {
  id: 6686272246,
  name: "WuzzSTORE",
  username: "WuzzSTORE",
  socialMedia: [
    {
      name: "-",
      url: "-",
    },
  ],
};
