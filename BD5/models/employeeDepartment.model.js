let { DataTypes, sequelize } = require('../lib/');

let { employee } = require('../models/employee.model');
let { department } = require('../models/department.model');

let employeeDepartment = sequelize.define('employeeDepartment', {
  employeeId: {
    type: DataTypes.INTEGER,
    references: {
      model: employee,
      key: 'id',
    },
  },
  departmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: department,
      key: 'id',
    },
  },
});

employee.belongsToMany(department, { through: employeeDepartment });
department.belongsToMany(employee, { through: employeeDepartment });

module.exports = { employeeDepartment };
