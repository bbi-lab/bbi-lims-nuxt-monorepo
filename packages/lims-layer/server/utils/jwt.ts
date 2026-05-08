import JWT from 'jsonwebtoken'
import _ from 'lodash'
import type { StringValue } from "ms"

const config = useRuntimeConfig()

const JWT_ACCESS_CONFIG: JWT.SignOptions = {
  expiresIn: config.authJwtAccessTokenExpiresIn as StringValue,
}
const JWT_REFRESH_CONFIG: JWT.SignOptions = {
  expiresIn: config.authJwtRefreshTokenExpiresIn as StringValue,
}

export function generateTokens(userId: string) {
  return {
    authenticated: true,
    accessToken: JWT.sign({ userId }, config.authJwtAccessTokenSecret, JWT_ACCESS_CONFIG),
    refreshToken: JWT.sign({ userId }, config.authJwtRefreshTokenSecret, JWT_REFRESH_CONFIG),
  }
}

export function verifyToken(token: string) {
  try {
    const data = JWT.verify(token, config.authJwtAccessTokenSecret)

    return data as { userId: string }
  }
  catch (err) {
    if (err instanceof JWT.TokenExpiredError) {
      throw createError({
        status: 401,
        statusMessage: 'UNAUTHORIZED',
        message: 'TOKEN EXPIRED'
      })
    }

    throw createError({
      status: 401,
      statusMessage: 'UNAUTHORIZED',
      message: 'INVALID TOKEN'
    })
  }
}

export function refreshTokens(refreshToken: string) {
  try {
    const tokenPayload = JWT.verify(refreshToken, config.authJwtRefreshTokenSecret)
    const newTokenPayload = _.pick(tokenPayload, ['userId'])

    const accessToken = JWT.sign(newTokenPayload, config.authJwtAccessTokenSecret, JWT_ACCESS_CONFIG)
    const newRefreshToken = JWT.sign(newTokenPayload, config.authJwtRefreshTokenSecret, JWT_REFRESH_CONFIG)

    return {
      authenticated: true,
      accessToken,
      refreshToken: newRefreshToken,
    }
  }
  catch (err) {
    return { authenticated: false }
  }
}
