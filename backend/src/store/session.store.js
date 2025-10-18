const validTokens = new Map();

export const saveToken = (token) => validTokens.set(token, true);
export const getToken = (token) => validTokens.get(token);
export const deleteToken = (token) => validTokens.delete(token);