export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('lawyers', 'working_hours', {
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: {},
  });

  await queryInterface.addColumn('lawyers', 'bar_council_image_s3_key', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('lawyers', 'bar_council_image_s3_key');
  await queryInterface.removeColumn('lawyers', 'working_hours');
}

export default { up, down };

