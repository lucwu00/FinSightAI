const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const PolicyStore = sequelize.define('PolicyStore', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    policyId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        is: /^PT\d{3}$/
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['Life Insurance', 'Health Insurance', 'Property Insurance', 'Specialty Insurance']]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    detailedDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    defaultCoverageAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    defaultPremium: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    defaultFrequency: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['Monthly', 'Quarterly', 'Semi-Annually', 'Annually', 'One-time']]
      }
    },
    protections: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const value = this.getDataValue('protections');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    legalTerms: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const value = this.getDataValue('legalTerms');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : [];
      }
    },
    coverage: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const value = this.getDataValue('coverage');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : {};
      }
    },
    eligibility: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    exclusions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'PolicyStore',
    timestamps: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['policyId']
      }
    ]
  });

  const PolicyCategories = sequelize.define('PolicyCategories', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    categoryKey: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    categoryName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'PolicyCategories',
    timestamps: true,
    updatedAt: false
  });

  const PolicyProviders = sequelize.define('PolicyProviders', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    providerName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'PolicyProviders',
    timestamps: true,
    updatedAt: false
  });

  sequelize.models.PolicyCategories = PolicyCategories;
  sequelize.models.PolicyProviders = PolicyProviders;

  return PolicyStore;
};