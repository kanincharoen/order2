import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "table_status_enum" AS ENUM ('available', 'occupied', 'reserved', 'needs_cleaning')
    `);
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM ('pending', 'in_progress', 'ready', 'served', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "printer_connection_type_enum" AS ENUM ('usb', 'network', 'bluetooth')
    `);
    await queryRunner.query(`
      CREATE TYPE "order_source_enum" AS ENUM ('staff', 'customer_qr')
    `);

    // staff_user
    await queryRunner.query(`
      CREATE TABLE "staff_user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" varchar(50) NOT NULL,
        "password_hash" varchar NOT NULL,
        "failed_login_attempts" int NOT NULL DEFAULT 0,
        "locked_until" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_staff_user_username" UNIQUE ("username"),
        CONSTRAINT "PK_staff_user" PRIMARY KEY ("id")
      )
    `);

    // session
    await queryRunner.query(`
      CREATE TABLE "session" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_session" PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id") REFERENCES "staff_user"("id") ON DELETE CASCADE
      )
    `);

    // table_entity
    await queryRunner.query(`
      CREATE TABLE "table_entity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "table_number" int NOT NULL,
        "seating_capacity" int NOT NULL,
        "status" "table_status_enum" NOT NULL DEFAULT 'available',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_table_entity_table_number" UNIQUE ("table_number"),
        CONSTRAINT "PK_table_entity" PRIMARY KEY ("id")
      )
    `);

    // qr_code
    await queryRunner.query(`
      CREATE TABLE "qr_code" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "table_id" uuid NOT NULL,
        "session_token" varchar(64) NOT NULL,
        "order_url" varchar NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "generated_at" timestamptz NOT NULL DEFAULT now(),
        "invalidated_at" timestamptz,
        CONSTRAINT "UQ_qr_code_session_token" UNIQUE ("session_token"),
        CONSTRAINT "PK_qr_code" PRIMARY KEY ("id"),
        CONSTRAINT "FK_qr_code_table" FOREIGN KEY ("table_id") REFERENCES "table_entity"("id") ON DELETE CASCADE
      )
    `);

    // qr_printer_config
    await queryRunner.query(`
      CREATE TABLE "qr_printer_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "printer_name" varchar(100) NOT NULL,
        "connection_type" "printer_connection_type_enum" NOT NULL,
        "network_address" varchar,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_qr_printer_config" PRIMARY KEY ("id")
      )
    `);

    // menu_item
    await queryRunner.query(`
      CREATE TABLE "menu_item" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "description" text,
        "price" decimal(7,2) NOT NULL,
        "category" varchar(100) NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_item" PRIMARY KEY ("id")
      )
    `);

    // order_entity
    await queryRunner.query(`
      CREATE TABLE "order_entity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "table_id" uuid NOT NULL,
        "qr_session_token" varchar,
        "status" "order_status_enum" NOT NULL DEFAULT 'pending',
        "total_price" decimal(10,2) NOT NULL DEFAULT 0,
        "cancellation_reason" varchar(200),
        "order_source" "order_source_enum" NOT NULL DEFAULT 'staff',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_entity" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_table" FOREIGN KEY ("table_id") REFERENCES "table_entity"("id") ON DELETE CASCADE
      )
    `);

    // order_item
    await queryRunner.query(`
      CREATE TABLE "order_item" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "menu_item_id" uuid NOT NULL,
        "quantity" int NOT NULL,
        "special_instructions" varchar(200),
        "unit_price" decimal(7,2) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_item" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_item_order" FOREIGN KEY ("order_id") REFERENCES "order_entity"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_item_menu_item" FOREIGN KEY ("menu_item_id") REFERENCES "menu_item"("id")
      )
    `);

    // order_status_history
    await queryRunner.query(`
      CREATE TABLE "order_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "from_status" "order_status_enum" NOT NULL,
        "to_status" "order_status_enum" NOT NULL,
        "changed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_status_history_order" FOREIGN KEY ("order_id") REFERENCES "order_entity"("id") ON DELETE CASCADE
      )
    `);

    // Enable uuid extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_session_user_id" ON "session" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_qr_code_table_id" ON "qr_code" ("table_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_qr_code_session_token" ON "qr_code" ("session_token")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_table_id" ON "order_entity" ("table_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_status" ON "order_entity" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_created_at" ON "order_entity" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_item_order_id" ON "order_item" ("order_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_status_history_order_id" ON "order_status_history" ("order_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_status_history"`);
    await queryRunner.query(`DROP TABLE "order_item"`);
    await queryRunner.query(`DROP TABLE "order_entity"`);
    await queryRunner.query(`DROP TABLE "menu_item"`);
    await queryRunner.query(`DROP TABLE "qr_printer_config"`);
    await queryRunner.query(`DROP TABLE "qr_code"`);
    await queryRunner.query(`DROP TABLE "table_entity"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "staff_user"`);
    await queryRunner.query(`DROP TYPE "order_source_enum"`);
    await queryRunner.query(`DROP TYPE "printer_connection_type_enum"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
    await queryRunner.query(`DROP TYPE "table_status_enum"`);
  }
}
