const express = require("express");
const app = express();

app.use(express.json());

let { sequelize } = require("./lib/index");
let { employee } = require("./models/employee.model");
let { department } = require("./models/department.model");
let { role } = require("./models/role.model");

let { employeeDepartment } = require("./models/employeeDepartment.model");
let { employeeRole } = require("./models/employeeRole.model");

let departs = [{ name: "Engineering" }, { name: "Marketing" }];

app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:${3000}`);
});

app.get("/seed_db", async (req, res) => {
  await sequelize.sync({ force: true });

  const departments = await department.bulkCreate(departs);

  const roles = await role.bulkCreate([
    { title: "Software Engineer" },
    { title: "Marketing Specialist" },
    { title: "Product Manager" },
  ]);

  const employees = await employee.bulkCreate([
    {
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
    },
    {
      name: "Priya Singh",
      email: "priya.singh@example.com",
    },
    {
      name: "Ankit Verma",
      email: "ankit.verma@example.com",
    },
  ]);

  // Associate employees with departments and roles using create method on junction models
  await employeeDepartment.create({
    employeeId: employees[0].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[0].id,
    roleId: roles[0].id,
  });

  await employeeDepartment.create({
    employeeId: employees[1].id,
    departmentId: departments[1].id,
  });
  await employeeRole.create({
    employeeId: employees[1].id,
    roleId: roles[1].id,
  });

  await employeeDepartment.create({
    employeeId: employees[2].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[2].id,
    roleId: roles[2].id,
  });

  return res.json({ message: "Database seeded!" });
});

// Helper function to get employee's associated departments
async function getEmployeeDepartments(employeeId) {
  const employeeDepartments = await employeeDepartment.findAll({
    where: { employeeId },
  });

  let departmentData;
  for (let empDep of employeeDepartments) {
    departmentData = await department.findOne({
      where: { id: empDep.departmentId },
    });
  }

  return departmentData.dataValues;
}

// Helper function to get employee's associated roles
async function getEmployeeRoles(employeeId) {
  const employeeRoles = await employeeRole.findAll({
    where: { employeeId },
  });

  let roleData;
  for (let empRole of employeeRoles) {
    roleData = await role.findOne({
      where: { id: empRole.roleId },
    });
  }

  return roleData.dataValues;
}

// Helper function to get employee details with associated departments and roles
async function getEmployeeDetails(employeeData) {
  const department = await getEmployeeDepartments(employeeData.id);
  const role = await getEmployeeRoles(employeeData.id);

  return {
    ...employeeData.dataValues,
    department,
    role,
  };
}

async function fetchAllEmployees() {
  let employees = await employee.findAll();
  let empDetails = [];

  for (i = 0; i < employees.length; i++) {
    let empDetail = await getEmployeeDetails(employees[i]);
    empDetails.push(empDetail);
  }
  return { employees: empDetails };
}

app.get("/employees", async (req, res) => {
  try {
    let response = await fetchAllEmployees();
    if (response.employees.length === 0) {
      res.status(404).json({ message: "No employees found" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchEmployeeById(employeeId) {
  let employeeData = await employee.findOne({
    where: { id: employeeId },
  });

  let empDetail = await getEmployeeDetails(employeeData);
  return { employee: empDetail };
}

app.get("/employee/details/:id", async (req, res) => {
  try {
    let employeeId = req.params.id;
    let response = await fetchEmployeeById(employeeId);
    if (response.employee.length === 0) {
      res.status(404).json({ message: "No employee found" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchEmployeesByDepartmentId(departmentId) {
  let employeeDepartments = await employeeDepartment.findAll({
    where: { departmentId: departmentId },
  });

  let emps = [];
  for (let empDep of employeeDepartments) {
    let emp = await employee.findOne({
      where: { id: empDep.employeeId },
    });
    emps.push(emp);
  }

  let empDetails = [];

  for (i = 0; i < emps.length; i++) {
    let empDetail = await getEmployeeDetails(emps[i]);
    empDetails.push(empDetail);
  }
  return { employees: empDetails };
}

app.get("/employees/department/:departmentId", async (req, res) => {
  try {
    let departmentId = req.params.departmentId;
    let response = await fetchEmployeesByDepartmentId(departmentId);
    if (response.employees.length === 0) {
      res.status(404).json({ message: "No employees found" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchEmployeesByRoleId(roleId) {
  let employeeRoles = await employeeRole.findAll({
    where: { roleId: roleId },
  });

  let emps = [];
  for (let empRole of employeeRoles) {
    let emp = await employee.findOne({
      where: { id: empRole.employeeId },
    });
    emps.push(emp);
  }

  let empDetails = [];

  for (i = 0; i < emps.length; i++) {
    let empDetail = await getEmployeeDetails(emps[i]);
    empDetails.push(empDetail);
  }
  return { employees: empDetails };
}

app.get("/employees/role/:roleId", async (req, res) => {
  try {
    let roleId = req.params.roleId;
    let response = await fetchEmployeesByRoleId(roleId);
    if (response.employees.length === 0) {
      res.status(404).json({ message: "No employees found" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function sortEmployeesByName(order) {
  let sortedEmployees = await employee.findAll({
    order: [["name", order]],
  });

  let empDetails = [];

  for (let emp of sortedEmployees) {
    let empDetail = await getEmployeeDetails(emp);
    empDetails.push(empDetail);
  }
  return { employees: empDetails };
}

app.get("/employees/sort-by-name", async (req, res) => {
  try {
    let order = req.query.order;
    let response = await sortEmployeesByName(order);
    if (response.employees.length === 0) {
      res.status(404).json({ message: "No employees found" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function addNewEmployee(newEmployee) {
  let employeeData = await employee.create({
    name: newEmployee.name,
    email: newEmployee.email,
  });

  await employeeDepartment.create({
    employeeId: employeeData.id,
    departmentId: parseInt(newEmployee.departmentId),
  });
  await employeeRole.create({
    employeeId: employeeData.id,
    roleId: parseInt(newEmployee.roleId),
  });

  return fetchEmployeeById(employeeData.id);
}

app.post("/employees/new", async (req, res) => {
  try {
    let newEmployee = req.body.newEmployee;
    let response = await addNewEmployee(newEmployee);
    if (response.employee.length === 0) {
      res.status(404).json({ message: "No employee found" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function updateEmployeeById(updatedEmployee, employeeId) {
  let employeeData = await employee.findOne({
    where: { id: employeeId },
  });

  if (!employeeData) {
    return {};
  }

  if (
    updatedEmployee.departmentId &&
    parseInt(updatedEmployee.departmentId) != 0 &&
    parseInt(updatedEmployee.departmentId) != employeeData.departmentId
  ) {
    await employeeDepartment.destroy({
      where: {
        employeeId: parseInt(employeeData.id),
      },
    });
    await employeeDepartment.create({
      employeeId: employeeData.id,
      departmentId: parseInt(updatedEmployee.departmentId),
    });
  }

  if (
    updatedEmployee.roleId &&
    parseInt(updatedEmployee.roleId) != 0 &&
    parseInt(updatedEmployee.roleId) != employeeData.roleId
  ) {
    await employeeRole.destroy({
      where: {
        employeeId: parseInt(employeeData.id),
      },
    });
    await employeeRole.create({
      employeeId: employeeData.id,
      roleId: parseInt(updatedEmployee.roleId),
    });
  }

  if (updatedEmployee.name && employeeData.name != updatedEmployee.name) {
    employeeData.set(updatedEmployee);
    await employeeData.save();
  }

  if (updatedEmployee.email && employeeData.email != updatedEmployee.email) {
    employeeData.set(updatedEmployee);
    await employeeData.save();
  }

  return fetchEmployeeById(employeeData.id);
}

app.post("/employees/update/:id", async (req, res) => {
  try {
    let updatedEmployee = req.body;
    let employeeId = parseInt(req.params.id);
    let response = await updateEmployeeById(updatedEmployee, employeeId);
    if (response.employee.length === 0) {
      res.status(404).json({ message: "No employee found" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function deleteEmployeeById(employeeId) {
  await employee.destroy({
    where: { id: employeeId },
  });

  await employeeDepartment.destroy({
    where: {
      employeeId: employeeId,
    },
  });

  await employeeRole.destroy({
    where: {
      employeeId: employeeId,
    },
  });

  return { message: "Employee with ID " + employeeId + " has been deleted." };
}

app.post("/employees/delete", async (req, res) => {
  try {
    let employeeId = req.body;
    let employeeData = await employee.findOne({
      where: { id: employeeId.id },
    });

    if (!employeeData) {
      res.status(404).json({
        message:
          "employee with ID " + employeeId.id + " not found to be deleted",
      });
    } else {
      let response = await deleteEmployeeById(employeeData.id);

      res.status(200).send(response);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
