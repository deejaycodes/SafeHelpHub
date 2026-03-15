export const jwtConstants = {
  secret: process.env.JWT_KEY || 'sporty_secretKey_for_sure',
  LOGIN_EXPIRY: '86400s',
};
