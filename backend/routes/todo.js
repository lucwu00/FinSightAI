const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

router.get("/", todoController.getAllTodos);
router.post("/", todoController.postTodo);
router.put("/:id", todoController.putTodo);
router.delete("/:id", todoController.deleteTodo);

module.exports = router;