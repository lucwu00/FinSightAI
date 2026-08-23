module.exports = (sequelize, DataTypes) => {
  const Policy = sequelize.define(
    "Policy",
    {
      policyId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      clientId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'clientId' 
        }
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      policyName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fundTypeILP: {
        type: DataTypes.STRING,
        allowNull: true
      },
      coverageAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      premiumFrequency: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['Monthly', 'Quarterly', 'Annually', 'Semi-Annually', 'One-time']]
        }
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },

      premium: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },

      policyTypeId: {
  type: DataTypes.STRING,
  allowNull: false  
},

      



      provider: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['AIA', 'Prudential', 'AXA', 'Great Eastern', 'NTUC Income', 'Manulife']]
        }
      },
  
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Active',
        validate: {
          isIn: [['Active', 'Inactive', 'Expiring Soon', 'Expired']]
        }
      },
      recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      advisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },





    {
      tableName: "policies",
      timestamps: false
    }
  );

  Policy.associate = (models) => {
    Policy.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    Policy.belongsTo(models.User, { foreignKey: "advisorId", as: "advisor" });
  };

  return Policy;
};
