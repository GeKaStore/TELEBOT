module.exports = () => {
  const tz = global.moment().tz(global.timezone);
  const format = "HH:mm:ss - dddd, DD MMMM YYYY";
  return tz.format(format);
};
