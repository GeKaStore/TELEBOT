module.exports = (array, page, size) => {
  return new Promise((resolve) => {
    const totalPages = Math.ceil(array.length / size);

    if (page > totalPages) {
      resolve({
        totalPages,
        page: 1,
        data: array.slice(0, size),
      });
    }
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    resolve({
      totalPages,
      page: page,
      data: array.slice(startIndex, endIndex),
    });
  });
};
