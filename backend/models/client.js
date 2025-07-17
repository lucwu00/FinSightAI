module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    "Client",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nric: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      martialStatust: {
        type: DataTypes.STRING, 
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dob: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Financial metadata
occupation: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      incomeBracket: {
        type: DataTypes.STRING, // e.g. "<30k", "30k-60k", etc.
        allowNull: true,
      },
      annualIncome: {
        type: DataTypes.FLOAT,
        allowNull: false
      },

      paymentFrequency: {
        type: DataTypes.STRING, 
        allowNull: true,
      },

      riskProfile: {
        type: DataTypes.STRING, // e.g. "Conservative", "Balanced", "Aggressive"
        allowNull: true,
      },

      // Link to advisor (if multi-user system)
      advisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      // Engagement tracking
      lastContactedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "clients",
      timestamps: true, // Adds createdAt, updatedAt
    }
  );

    Client.associate = (models) => {
        Client.belongsTo(models.User, {
            foreignKey: "advisorId",
            as: "advisor",
        });

        Client.hasMany(models.Policy, {
            foreignKey: "clientId",
            as: "policies",
        });
};

  return Client;
};
