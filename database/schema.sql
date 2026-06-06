-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT fk_buyer FOREIGN KEY (buyer_id) REFERENCES public.users(id),
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id)
);
-- CREATE TABLE public.conversations (
--   id uuid NOT NULL DEFAULT gen_random_uuid(),
--   order_id uuid NOT NULL,
--   buyer_id uuid NOT NULL,
--   farmer_id uuid NOT NULL,
--   last_message text,
--   created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
--   updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT conversations_pkey PRIMARY KEY (id),
--   CONSTRAINT conversations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
--   CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id),
--   CONSTRAINT conversations_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES public.users(id)
-- );
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL DEFAULT 'NOT NULL'::text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT fk_buyer FOREIGN KEY (buyer_id) REFERENCES public.users(id),
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL,
  name character varying NOT NULL,
  category character varying,
  description text,
  price numeric NOT NULL,
  quantity integer NOT NULL,
  location character varying,
  image_url character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT fk_farmer FOREIGN KEY (farmer_id) REFERENCES public.users(id),
  CONSTRAINT products_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone_number text NOT NULL,
  role text NOT NULL,
  business_name text NOT NULL,
  location text NOT NULL,
  password text,
  profile_image_url text,
  biography text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Payments table: store provider payment records tied to a batch of accepted orders
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  order_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_count integer NOT NULL DEFAULT 1,
  provider character varying NOT NULL,
  provider_payment_id character varying,
  amount_cents integer NOT NULL,
  currency character varying(8) NOT NULL DEFAULT 'ETB',
  status character varying NOT NULL DEFAULT 'pending' CHECK (status::text = ANY (ARRAY['pending'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[])),
  batch_reference character varying,
  raw_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id)
);