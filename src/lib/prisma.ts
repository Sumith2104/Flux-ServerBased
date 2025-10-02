
import { PrismaClient } from '@prisma/client'

// This file implements a robust singleton pattern for the Prisma Client.
// In development, Next.js clears the Node.js module cache on every request,
// which would lead to a new PrismaClient instance being created each time,
// quickly exhausting database connections. This implementation prevents that
// by storing the PrismaClient instance on a global object, which is not
// affected by module reloading.

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
