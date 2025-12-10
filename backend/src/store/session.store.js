const validTokens = new Map();
let noOfWrites = 0;

export const saveToken = (token) => validTokens.set(token, true);
export const getToken = (token) => validTokens.get(token);
export const deleteToken = (token) => validTokens.delete(token);

export const getNoOfWrites = () => noOfWrites;
export const increaseNoOfWrites = () => noOfWrites += 1;
export const resetNoOfWrites = () => noOfWrites = 0;