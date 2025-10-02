
import { PrismaClient } from '@prisma/client'

// This file implements a robust singleton pattern for the Prisma Client.
// In development, Next.js clears the Node.js module cache on every request,
// which would lead to a new PrismaClient instance being created each time,
// quickly exhausting database connections. This implementation prevents that
// by storing the PrismaClient instance on a global object, which is not
// affected by module reloading.

// We declare a global variable to hold the Prisma client.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// We check if a prisma instance already exists on the global object.
// If it doesn't, we create a new one. In production, this will only
// run once. In development, this ensures we reuse the existing client.
const prisma = globalThis.prisma || new PrismaClient()

// In development, we assign the new client to the global object.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
