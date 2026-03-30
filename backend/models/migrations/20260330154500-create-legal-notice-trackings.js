export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('legal_notice_trackings', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    document_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'documents', key: 'id' },
      onDelete: 'CASCADE',
    },
    tracking_number: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    sent_via: {
      type: Sequelize.ENUM('registered_post', 'email', 'both'),
      allowNull: false,
    },
    sent_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    delivered_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    response_deadline: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    response_received: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('legal_notice_trackings');
}

export default { up, down };

