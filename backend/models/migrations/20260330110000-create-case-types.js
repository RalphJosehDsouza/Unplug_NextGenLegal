const CRIMINAL_CASE_TYPE_ID = '6fe8e0c1-4dbd-40d8-9688-8e727c443bea';
const DIVORCE_CASE_TYPE_ID = 'c4e87af9-0d54-4ee8-9fce-c7bf1a9a7216';
const CIVIL_CASE_TYPE_ID = 'ec8e7f44-8550-4458-b74c-ec389f4ca8d7';
const PROPERTY_CASE_TYPE_ID = '7df9f373-3707-478a-8a41-5fba5649ab17';
const CORPORATE_CASE_TYPE_ID = '846ba513-9af0-4957-a90f-4a039ec7e687';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('case_types', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });

  await queryInterface.bulkInsert('case_types', [
    {
      id: CRIMINAL_CASE_TYPE_ID,
      name: 'Criminal',
      slug: 'criminal',
      active: true,
      created_at: new Date(),
    },
    {
      id: DIVORCE_CASE_TYPE_ID,
      name: 'Divorce',
      slug: 'divorce',
      active: true,
      created_at: new Date(),
    },
    {
      id: CIVIL_CASE_TYPE_ID,
      name: 'Civil',
      slug: 'civil',
      active: true,
      created_at: new Date(),
    },
    {
      id: PROPERTY_CASE_TYPE_ID,
      name: 'Property',
      slug: 'property',
      active: true,
      created_at: new Date(),
    },
    {
      id: CORPORATE_CASE_TYPE_ID,
      name: 'Corporate',
      slug: 'corporate',
      active: true,
      created_at: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('case_types');
}

export default { up, down };
