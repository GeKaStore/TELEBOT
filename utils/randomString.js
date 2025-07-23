module.exports = (length) =>
  require("crypto").randomBytes(length).toString("hex");
