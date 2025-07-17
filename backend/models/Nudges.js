module.exports = (sequelize, DataTypes) => {
  const Nudge = sequelize.define(
    "Nudge",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true, // nullable if general alert
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      category: {
        type: DataTypes.STRING,
        allowNull: true,
        // Examples: "policy_expiry", "investment_opportunity", "follow_up"
      },

      source: {
        type: DataTypes.STRING,
        allowNull: true,
        // Example: "gemini-ai", "manual", "system"
      },

      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        defaultValue: "medium",
      },

      dismissed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      actionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        // e.g. "/client/5/policies/123" to link directly from nudge
      },

      metadata: {
        type: DataTypes.JSON, // flexible structure for Gemini AI output, or tags
        allowNull: true,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "nudges",
    }
  );

  // Associations
  Nudge.associate = (models) => {
    Nudge.belongsTo(models.User, { foreignKey: "userId" });
    Nudge.belongsTo(models.Client, { foreignKey: "clientId" }); // add this!
  };

  return Nudge;
};
