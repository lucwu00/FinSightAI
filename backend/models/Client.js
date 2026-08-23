module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    "Client",
    {
      clientId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      nric: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: /^\+65\s\d{8}$/
        }
      },
      dob: {
        type: DataTypes.DATE,
        allowNull: false
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['Male', 'Female', 'Other']]
        }
      },
      maritalStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['Single', 'Married', 'Divorced', 'Widowed']]
        }
      },
      occupation: {
        type: DataTypes.STRING,
        allowNull: false
      },
      incomeBracket: {
        type: DataTypes.STRING,
        allowNull: true
      },
      annualIncome: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      paymentFrequency: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['monthly', 'quarterly', 'annually']]
        }
      },
      riskProfile: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['Conservative', 'Balanced', 'Aggressive']]
        }
      },
      advisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      lastContactedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "clients",
      timestamps: false
    }
  );

  Client.associate = (models) => {
    Client.hasMany(models.Nudge, { foreignKey: "clientId", as: "nudges" });
    Client.hasMany(models.Policy, { foreignKey: "clientId", as: "policies" });
    Client.belongsTo(models.User, { foreignKey: "advisorId", as: "advisor" });
  };

  return Client;
};
