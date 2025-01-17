export const handlePaginationParams = (limit, page) => {
  const generalLimit = 10;
  const generalPage = 1;
  const skip = (generalPage - 1) * generalLimit;
  if (!limit || !page) {
    return { limit: generalLimit, page: generalPage, skip };
  }
  limit = Number(limit);
  page = Number(page);
  if (isNaN(limit) || isNaN(page) || limit > 20 || limit <= 0 || page <= 0) {
    return { limit: generalLimit, page: generalPage, skip };
  }
  return { limit, page, skip: (page - 1) * limit };
};
