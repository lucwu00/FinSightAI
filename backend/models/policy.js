module.exports = (sequelize, DataTypes) => {
  const Policy = sequelize.define(
    "Policy",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      policyName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      policyType: {
        type: DataTypes.STRING, // e.g. "Life", "Health", "Investment"
        allowNull: true,
      },
      provider: {
        type: DataTypes.STRING, // e.g. "AXA", "Prudential"
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      premium: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING, // e.g. "Active", "Lapsed", "Cancelled"
        allowNull: true,
        defaultValue: "Active",
      },
      recommended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Foreign keys
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      advisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "policies",
      timestamps: true,
    }
  );

  Policy.associate = (models) => {
    Policy.belongsTo(models.Client, {
      foreignKey: "clientId",
      as: "client",
    });

    Policy.belongsTo(models.User, {
      foreignKey: "advisorId",
      as: "advisor",
    });
  };

  return Policy;
};
