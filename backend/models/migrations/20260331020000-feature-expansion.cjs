'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('users');

    // 1. Add subscription_tier to users if it doesn't exist
    if (!tableDesc.subscription_tier) {
      // Create the ENUM type first
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_users_subscription_tier" AS ENUM ('free', 'starter', 'professional', 'business');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.addColumn('users', 'subscription_tier', {
        type: Sequelize.ENUM('free', 'starter', 'professional', 'business'),
        allowNull: false,
        defaultValue: 'business',
      });
    } else {
      // Column exists — add new enum values if needed
      await queryInterface.sequelize.query(`
        DO $$ BEGIN ALTER TYPE "enum_users_subscription_tier" ADD VALUE IF NOT EXISTS 'starter'; EXCEPTION WHEN duplicate_object THEN null; END $$;
      `).catch(() => {});
      await queryInterface.sequelize.query(`
        DO $$ BEGIN ALTER TYPE "enum_users_subscription_tier" ADD VALUE IF NOT EXISTS 'professional'; EXCEPTION WHEN duplicate_object THEN null; END $$;
      `).catch(() => {});
      await queryInterface.sequelize.query(`
        DO $$ BEGIN ALTER TYPE "enum_users_subscription_tier" ADD VALUE IF NOT EXISTS 'business'; EXCEPTION WHEN duplicate_object THEN null; END $$;
      `).catch(() => {});

      // Migrate old values to new values
      await queryInterface.sequelize.query(`
        UPDATE users SET subscription_tier = 'business' WHERE subscription_tier IN ('premium', 'pro', 'basic');
      `).catch(() => {});
    }

    // 2. Add subscription_billing column
    if (!tableDesc.subscription_billing) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_users_subscription_billing" AS ENUM ('monthly', 'yearly');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.addColumn('users', 'subscription_billing', {
        type: Sequelize.ENUM('monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly',
      });
    }

    // 3. Add subscription date columns
    if (!tableDesc.subscription_started_at) {
      await queryInterface.addColumn('users', 'subscription_started_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDesc.subscription_expires_at) {
      await queryInterface.addColumn('users', 'subscription_expires_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDesc.documents_generated_this_month) {
      await queryInterface.addColumn('users', 'documents_generated_this_month', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    // 4. Create business_registrations table
    const allTables = await queryInterface.sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const tableNames = allTables.map(t => t.tablename);

    if (!tableNames.includes('business_registrations')) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_business_registrations_entity_type" AS ENUM (
            'private_limited', 'llp', 'opc', 'partnership', 'sole_proprietorship', 'section_8', 'producer_company'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_business_registrations_status" AS ENUM ('draft', 'documents_generated', 'sent_to_lawyer');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.createTable('business_registrations', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('uuid_generate_v4()'),
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        entity_type: {
          type: Sequelize.ENUM('private_limited', 'llp', 'opc', 'partnership', 'sole_proprietorship', 'section_8', 'producer_company'),
          allowNull: false,
        },
        company_name: { type: Sequelize.STRING, allowNull: false },
        state: { type: Sequelize.STRING, allowNull: false },
        registered_address: { type: Sequelize.TEXT, allowNull: true },
        directors: { type: Sequelize.JSONB, allowNull: true, defaultValue: [] },
        authorized_capital: { type: Sequelize.INTEGER, allowNull: true },
        paid_up_capital: { type: Sequelize.INTEGER, allowNull: true },
        main_objects: { type: Sequelize.TEXT, allowNull: true },
        status: {
          type: Sequelize.ENUM('draft', 'documents_generated', 'sent_to_lawyer'),
          allowNull: false,
          defaultValue: 'draft',
        },
        generated_documents: { type: Sequelize.JSONB, allowNull: true, defaultValue: [] },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      });
    }

    // 5. Create trademark_applications table
    if (!tableNames.includes('trademark_applications')) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_trademark_applications_mark_type" AS ENUM ('word', 'device', 'combined', 'sound');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_trademark_applications_applicant_type" AS ENUM ('individual', 'startup', 'small_enterprise', 'large_enterprise');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_trademark_applications_status" AS ENUM ('draft', 'conflict_checked', 'documents_generated', 'sent_to_lawyer');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.createTable('trademark_applications', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('uuid_generate_v4()'),
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        mark_type: {
          type: Sequelize.ENUM('word', 'device', 'combined', 'sound'),
          allowNull: false,
        },
        trademark_name: { type: Sequelize.STRING, allowNull: false },
        trademark_description: { type: Sequelize.TEXT, allowNull: true },
        logo_url: { type: Sequelize.STRING, allowNull: true },
        nice_classes: { type: Sequelize.JSONB, allowNull: true, defaultValue: [] },
        applicant_name: { type: Sequelize.STRING, allowNull: false },
        applicant_address: { type: Sequelize.TEXT, allowNull: true },
        applicant_type: {
          type: Sequelize.ENUM('individual', 'startup', 'small_enterprise', 'large_enterprise'),
          allowNull: false,
          defaultValue: 'individual',
        },
        status: {
          type: Sequelize.ENUM('draft', 'conflict_checked', 'documents_generated', 'sent_to_lawyer'),
          allowNull: false,
          defaultValue: 'draft',
        },
        conflict_report: { type: Sequelize.JSONB, allowNull: true },
        generated_documents: { type: Sequelize.JSONB, allowNull: true, defaultValue: [] },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      });
    }

    // 6. Create registered_agents table
    if (!tableNames.includes('registered_agents')) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_registered_agents_status" AS ENUM ('pending', 'active', 'inactive');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.createTable('registered_agents', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('uuid_generate_v4()'),
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        business_name: { type: Sequelize.STRING, allowNull: false },
        entity_type: { type: Sequelize.STRING, allowNull: true },
        registration_number: { type: Sequelize.STRING, allowNull: true },
        registered_state: { type: Sequelize.STRING, allowNull: false },
        agent_address: { type: Sequelize.TEXT, allowNull: true },
        notifications_email: { type: Sequelize.STRING, allowNull: false },
        status: {
          type: Sequelize.ENUM('pending', 'active', 'inactive'),
          allowNull: false,
          defaultValue: 'pending',
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      });
    }

    // 7. Create enterprise_leads table
    if (!tableNames.includes('enterprise_leads')) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_enterprise_leads_status" AS ENUM ('new', 'contacted', 'demo_scheduled', 'closed');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.createTable('enterprise_leads', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('uuid_generate_v4()'),
        },
        company_name: { type: Sequelize.STRING, allowNull: false },
        contact_name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false },
        phone: { type: Sequelize.STRING, allowNull: true },
        employee_count: { type: Sequelize.INTEGER, allowNull: true },
        message: { type: Sequelize.TEXT, allowNull: true },
        status: {
          type: Sequelize.ENUM('new', 'contacted', 'demo_scheduled', 'closed'),
          allowNull: false,
          defaultValue: 'new',
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('enterprise_leads').catch(() => {});
    await queryInterface.dropTable('registered_agents').catch(() => {});
    await queryInterface.dropTable('trademark_applications').catch(() => {});
    await queryInterface.dropTable('business_registrations').catch(() => {});
    await queryInterface.removeColumn('users', 'documents_generated_this_month').catch(() => {});
    await queryInterface.removeColumn('users', 'subscription_expires_at').catch(() => {});
    await queryInterface.removeColumn('users', 'subscription_started_at').catch(() => {});
    await queryInterface.removeColumn('users', 'subscription_billing').catch(() => {});
  },
};
