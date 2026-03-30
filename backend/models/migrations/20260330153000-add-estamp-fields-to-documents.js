export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('documents', 'estamped', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn('documents', 'estamp_certificate', {
    type: Sequelize.STRING(255),
    allowNull: true,
  });

  await queryInterface.addColumn('documents', 'stamp_duty_paise', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });

  await queryInterface.addColumn('documents', 'stamp_article_number', {
    type: Sequelize.STRING(255),
    allowNull: true,
  });

  await queryInterface.addColumn('documents', 'stamp_act_reference', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn('documents', 'stamp_state', {
    type: Sequelize.STRING(10),
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('documents', 'stamp_state');
  await queryInterface.removeColumn('documents', 'stamp_act_reference');
  await queryInterface.removeColumn('documents', 'stamp_article_number');
  await queryInterface.removeColumn('documents', 'stamp_duty_paise');
  await queryInterface.removeColumn('documents', 'estamp_certificate');
  await queryInterface.removeColumn('documents', 'estamped');
}

export default { up, down };

