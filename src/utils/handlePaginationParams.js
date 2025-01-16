export const handlePaginationParams = (limit, page) => {
  let generalLimit = 10,
    generalPage = 1;
  if (!limit || !page) {
    return { limit: generalLimit, page: generalPage };
  }
  limit = Number(limit);
  page = Number(page);
  if (isNaN(limit) || isNaN(page) || limit > 20 || limit <= 0 || page <= 0) {
    return { limit: generalLimit, page: generalPage };
  }
  return { limit, page };
};
