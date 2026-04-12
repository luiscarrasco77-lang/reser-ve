import { pgTable, text, integer, real, boolean, timestamp, serial, json, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['traveler', 'host', 'admin'])
export const posadaStatusEnum = pgEnum('posada_status', ['draft', 'active', 'suspended'])
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('traveler'),
  phone: text('phone'),
  country: text('country'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const posadas = pgTable('posadas', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  hostId: integer('host_id').references(() => users.id),
  nombre: text('nombre').notNull(),
  destino: text('destino').notNull(),
  destinoSlug: text('destino_slug').notNull(),
  tipo: text('tipo').notNull(),
  precio: integer('precio').notNull(), // USD per night
  habitaciones: integer('habitaciones').notNull(),
  capacidad: integer('capacidad').notNull().default(2),
  rating: real('rating').notNull().default(0),
  reviews: integer('reviews').notNull().default(0),
  descripcion: text('descripcion').notNull(),
  tags: json('tags').$type<string[]>().notNull().default([]),
  servicios: json('servicios').$type<string[]>().notNull().default([]),
  politicas: json('politicas').$type<string[]>().notNull().default([]),
  imgs: json('imgs').$type<string[]>().notNull().default([]),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  metodoPago: json('metodo_pago').$type<string[]>().notNull().default([]),
  status: posadaStatusEnum('status').notNull().default('active'),
  hostNombre: text('host_nombre'),
  hostDesde: text('host_desde'),
  hostIdiomas: json('host_idiomas').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  posadaId: integer('posada_id').references(() => posadas.id).notNull(),
  guestId: integer('guest_id').references(() => users.id).notNull(),
  checkIn: text('check_in').notNull(),   // ISO date string YYYY-MM-DD
  checkOut: text('check_out').notNull(),
  nights: integer('nights').notNull(),
  totalPrice: integer('total_price').notNull(), // USD
  status: bookingStatusEnum('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  guestCount: integer('guest_count').notNull().default(1),
  notes: text('notes'),
  hostNotes: text('host_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  posadaId: integer('posada_id').references(() => posadas.id).notNull(),
  bookingId: integer('booking_id').references(() => bookings.id),
  authorId: integer('author_id').references(() => users.id).notNull(),
  authorName: text('author_name').notNull(),
  authorCountry: text('author_country'),
  rating: integer('rating').notNull(),
  texto: text('texto').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// NextAuth tables (required by @auth/drizzle-adapter)
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
})
