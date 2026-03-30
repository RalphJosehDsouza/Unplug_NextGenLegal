export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('doc_reviews', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    filename: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    risk_score: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    analysis_json: {
      type: Sequelize.JSONB,
      allowNull: false,
    },
    lawyer_specialization_needed: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('doc_reviews');
}

export default { up, down };

