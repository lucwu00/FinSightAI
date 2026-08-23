module.exports = (sequelize, DataTypes) => {
  const Meeting = sequelize.define(
    "Meeting",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: "meetings",
      timestamps: false
    }
  );

  // Associations
  Meeting.associate = (models) => {
    // Example: Meeting.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
  };

  return Meeting;
};
